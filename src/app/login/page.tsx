'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2, Mail, Lock, User, Home, ChevronRight, Loader2,
  MapPin, Hash, ArrowLeft, Check, LogIn,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'entrar' | 'sindico' | 'morador'
type TipoCondominio = 'predio' | 'casas' | 'misto'

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '14px 16px',
      borderRadius: '12px',
      fontSize: '0.875rem',
      background: '#fff5f5',
      border: '1px solid #fecaca',
      color: '#dc2626',
      fontFamily: 'var(--font-body)',
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  )
}

function SuccessScreen({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0 16px', animation: 'fadeUp 0.5s var(--ease-spring) both' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'var(--mint-pale)', border: '3px solid var(--mint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Check size={32} style={{ color: 'var(--mint-dark)' }} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--navy)', marginBottom: '12px' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '340px' }}>
        {text}
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '2px solid var(--gray-200)',
  borderRadius: '12px',
  padding: '14px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  color: 'var(--gray-800)',
  outline: 'none',
  transition: 'border-color 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--gray-700)',
  marginBottom: '6px',
  fontFamily: 'var(--font-body)',
}

function Field({
  label, type = 'text', value, onChange, placeholder, children, required, minLength, maxLength,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; children?: React.ReactNode; required?: boolean; minLength?: number; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {children && (
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none', display: 'flex' }}>
            {children}
          </span>
        )}
        <input
          type={type}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            paddingLeft: children ? '44px' : '16px',
            borderColor: focused ? 'var(--navy)' : 'var(--gray-200)',
            boxShadow: focused ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
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

  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  const [sindicoStep, setSindicoStep] = useState<1 | 2>(1)
  const [sindicoNome, setSindicoNome] = useState('')
  const [sindicoEmail, setSindicoEmail] = useState('')
  const [sindicoSenha, setSindicoSenha] = useState('')
  const [condoNome, setCondoNome] = useState('')
  const [condoEndereco, setCondoEndereco] = useState('')
  const [condoCidade, setCondoCidade] = useState('')
  const [condoTipo, setCondoTipo] = useState<TipoCondominio>('predio')
  const [condoUnidades, setCondoUnidades] = useState('')

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

  function handleSindicoStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (sindicoSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSindicoStep(2)
  }

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

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nome: sindicoNome,
        email: sindicoEmail,
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

    const { data: condoRows, error: condoError } = await supabase
      .rpc('validar_codigo_convite', { codigo })

    const condo = condoRows?.[0] ?? null

    if (condoError || !condo) {
      setLoading(false)
      setError('Código de convite inválido. Verifique com o síndico do seu condomínio.')
      return
    }

    // Verificar se o apartamento já está ocupado
    const { data: disponivel } = await supabase.rpc('verificar_apartamento_disponivel', {
      p_condominio_id: condo.id,
      p_apartamento: moradorApartamento.trim(),
    })
    if (disponivel === false) {
      setLoading(false)
      setError('Já existe uma conta cadastrada para este apartamento. Se você é morador e não tem acesso, entre em contato com o síndico.')
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

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        nome: moradorNome,
        email: moradorEmail,
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'entrar', label: 'Entrar' },
    { key: 'sindico', label: 'Sou Síndico' },
    { key: 'morador', label: 'Sou Morador' },
  ]

  const TIPOS: { key: TipoCondominio; label: string; icon: React.ReactNode }[] = [
    { key: 'predio', label: 'Prédio', icon: <Building2 size={22} /> },
    { key: 'casas', label: 'Casas', icon: <Home size={22} /> },
    { key: 'misto', label: 'Misto', icon: <Hash size={22} /> },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(160deg, #faf9f7 0%, #ffffff 60%)',
      position: 'relative',
      overflow: 'hidden',
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

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', animation: 'fadeUp 0.5s var(--ease-spring) both' }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 16px 48px rgba(15,36,64,0.12)',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '40px 40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(30,58,95,0.3)',
            }}>
              <Building2 size={24} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--navy)', margin: 0 }}>
              CondomínioVoz
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ padding: '28px 40px 0' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              background: 'var(--gray-100)',
              borderRadius: '12px',
              padding: '4px',
              gap: '2px',
            }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => changeTab(key)}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: tab === key ? 600 : 400,
                    fontFamily: 'var(--font-body)',
                    color: tab === key ? 'var(--navy)' : 'var(--gray-500)',
                    background: tab === key ? '#fff' : 'transparent',
                    boxShadow: tab === key ? '0 1px 6px rgba(15,36,64,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '32px 40px 40px' }}>
            {error && <ErrorBox message={error} />}

            {/* ── ENTRAR ── */}
            {tab === 'entrar' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="seu@email.com" required>
                  <Mail size={16} />
                </Field>
                <Field label="Senha" type="password" value={loginSenha} onChange={setLoginSenha} placeholder="••••••••" required>
                  <Lock size={16} />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px', width: '100%',
                    padding: '16px', borderRadius: '14px',
                    background: 'var(--navy)', color: '#fff', border: 'none',
                    fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'transform 0.15s var(--ease-spring), box-shadow 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <><LogIn size={16} /> Entrar</>}
                </button>
              </form>
            )}

            {/* ── SOU SÍNDICO ── */}
            {tab === 'sindico' && !success && (
              <>
                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                  {[1, 2].map((step) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: sindicoStep >= step ? 'var(--navy)' : 'var(--gray-100)',
                        color: sindicoStep >= step ? '#fff' : 'var(--gray-400)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                        transition: 'all 0.3s var(--ease-spring)',
                      }}>
                        {sindicoStep > step ? <Check size={14} /> : step}
                      </div>
                      <span style={{
                        fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                        color: sindicoStep >= step ? 'var(--navy)' : 'var(--gray-400)',
                        fontWeight: sindicoStep >= step ? 600 : 400,
                      }}>
                        {step === 1 ? 'Seus dados' : 'Condomínio'}
                      </span>
                      {step < 2 && (
                        <div style={{ width: '24px', height: '1px', background: sindicoStep > step ? 'var(--navy)' : 'var(--gray-200)', marginRight: '4px' }} />
                      )}
                    </div>
                  ))}
                </div>

                {sindicoStep === 1 ? (
                  <form onSubmit={handleSindicoStep1} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
                        Dados do responsável
                      </p>
                    </div>
                    <Field label="Nome completo" value={sindicoNome} onChange={setSindicoNome} placeholder="Seu nome completo" required>
                      <User size={16} />
                    </Field>
                    <Field label="Email" type="email" value={sindicoEmail} onChange={setSindicoEmail} placeholder="seu@email.com" required>
                      <Mail size={16} />
                    </Field>
                    <Field label="Senha" type="password" value={sindicoSenha} onChange={setSindicoSenha} placeholder="Mínimo 6 caracteres" required minLength={6}>
                      <Lock size={16} />
                    </Field>
                    <button
                      type="submit"
                      style={{
                        marginTop: '6px', width: '100%', padding: '16px', borderRadius: '14px',
                        background: 'var(--navy)', color: '#fff', border: 'none',
                        fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'transform 0.15s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSindicoCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <button
                      type="button"
                      onClick={() => { setSindicoStep(1); setError('') }}
                      style={{
                        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.85rem', color: 'var(--gray-400)', background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: '4px',
                      }}
                    >
                      <ArrowLeft size={14} /> Voltar
                    </button>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Dados do condomínio
                    </p>
                    <Field label="Nome do condomínio" value={condoNome} onChange={setCondoNome} placeholder="Ex: Edifício Aurora" required>
                      <Building2 size={16} />
                    </Field>
                    <Field label="Endereço completo" value={condoEndereco} onChange={setCondoEndereco} placeholder="Rua, número, bairro" required>
                      <MapPin size={16} />
                    </Field>
                    <Field label="Cidade" value={condoCidade} onChange={setCondoCidade} placeholder="São Paulo" required>
                      <MapPin size={16} />
                    </Field>

                    {/* Tipo — cards visuais */}
                    <div>
                      <label style={labelStyle}>Tipo de condomínio</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '6px' }}>
                        {TIPOS.map(({ key, label, icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCondoTipo(key)}
                            style={{
                              padding: '16px 8px', borderRadius: '14px', cursor: 'pointer',
                              border: `2px solid ${condoTipo === key ? 'var(--navy)' : 'var(--gray-200)'}`,
                              background: condoTipo === key ? 'rgba(30,58,95,0.04)' : '#fff',
                              color: condoTipo === key ? 'var(--navy)' : 'var(--gray-500)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                              fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600,
                              transition: 'all 0.2s var(--ease-spring)',
                            }}
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field label="Total de unidades" type="number" value={condoUnidades} onChange={setCondoUnidades} placeholder="Ex: 48" required>
                      <Hash size={16} />
                    </Field>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        marginTop: '6px', width: '100%', padding: '16px', borderRadius: '14px',
                        background: 'var(--navy)', color: '#fff', border: 'none',
                        fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'transform 0.15s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' } }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
                    >
                      {loading ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</> : <><Check size={16} /> Cadastrar e Aguardar Aprovação</>}
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
              <form onSubmit={handleMoradorCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Dados do morador
                </p>
                <Field label="Nome completo" value={moradorNome} onChange={setMoradorNome} placeholder="Seu nome completo" required>
                  <User size={16} />
                </Field>
                <Field label="Email" type="email" value={moradorEmail} onChange={setMoradorEmail} placeholder="seu@email.com" required>
                  <Mail size={16} />
                </Field>
                <Field label="Senha" type="password" value={moradorSenha} onChange={setMoradorSenha} placeholder="Mínimo 6 caracteres" required minLength={6}>
                  <Lock size={16} />
                </Field>

                {/* Código de convite — destaque */}
                <div>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Código do condomínio
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                      borderRadius: '50px', background: 'var(--mint-pale)', color: 'var(--mint-dark)',
                    }}>
                      Peça ao síndico
                    </span>
                  </label>
                  <CodigoInput value={codigoConvite} onChange={setCodigoConvite} />
                  <p style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                    6 caracteres · letras e números
                  </p>
                </div>

                <Field label="Número do apartamento / casa" value={moradorApartamento} onChange={setMoradorApartamento} placeholder="Ex: 304" required>
                  <Home size={16} />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px', width: '100%', padding: '16px', borderRadius: '14px',
                    background: 'var(--navy)', color: '#fff', border: 'none',
                    fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'transform 0.15s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</> : <><ChevronRight size={16} /> Cadastrar e Aguardar Aprovação</>}
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

          {/* Footer */}
          <div style={{
            borderTop: '1px solid var(--gray-100)',
            padding: '16px 40px',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--gray-400)',
            fontFamily: 'var(--font-body)',
          }}>
            © 2026 CondomínioVoz
          </div>
        </div>
      </div>
    </div>
  )
}

// Input especial para código de convite
function CodigoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      required
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder="A3K9PX"
      style={{
        width: '100%',
        background: focused ? '#fff' : 'var(--gray-50)',
        border: `2px ${focused ? 'solid' : 'dashed'} ${focused ? 'var(--navy)' : 'var(--gray-300)'}`,
        borderRadius: '14px',
        padding: '16px',
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--navy)',
        letterSpacing: '0.3em',
        textAlign: 'center',
        outline: 'none',
        textTransform: 'uppercase',
        transition: 'all 0.2s var(--ease-spring)',
        boxShadow: focused ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
