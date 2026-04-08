'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CONDOMINIO_ID = 'a0000000-0000-0000-0000-000000000001'

const APARTAMENTOS = [
  '101', '102', '103', '104',
  '201', '202', '203', '204',
  '301', '302', '303', '304',
  '401', '402', '403', '404',
  '501', '502', '503', '504',
  '601', '602', '603', '604',
  '701', '702', '703', '704',
  '801', '802', '803', '804',
  '901', '902', '903', '904',
  '1001', '1002', '1003', '1004',
  '1101', '1102', '1103', '1104',
  '1201', '1202', '1203', '1204',
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'entrar' | 'cadastrar'>('entrar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  // Cadastro
  const [nome, setNome] = useState('')
  const [cadastroEmail, setCadastroEmail] = useState('')
  const [cadastroSenha, setCadastroSenha] = useState('')
  const [apartamento, setApartamento] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginSenha,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.')
      } else {
        setError('Erro ao entrar. Tente novamente.')
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!apartamento) {
      setError('Selecione o apartamento.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: cadastroEmail,
      password: cadastroSenha,
      options: {
        data: {
          nome,
          apartamento,
          condominio_id: CONDOMINIO_ID,
          role: 'morador',
        },
      },
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado.')
      } else if (error.message.includes('Password')) {
        setError('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setError('Erro ao cadastrar. Tente novamente.')
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Building2 size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e3a5f' }}>
            CondomínioVoz
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            A voz dos moradores, a decisão do síndico
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('entrar'); setError('') }}
              className="flex-1 py-3 text-sm font-semibold transition-colors"
              style={{
                color: tab === 'entrar' ? '#1e3a5f' : '#9ca3af',
                borderBottom: tab === 'entrar' ? '2px solid #1e3a5f' : '2px solid transparent',
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab('cadastrar'); setError('') }}
              className="flex-1 py-3 text-sm font-semibold transition-colors"
              style={{
                color: tab === 'cadastrar' ? '#1e3a5f' : '#9ca3af',
                borderBottom: tab === 'cadastrar' ? '2px solid #1e3a5f' : '2px solid transparent',
              }}
            >
              Cadastrar
            </button>
          </div>

          <div className="p-6">
            {/* Erro */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {tab === 'entrar' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-1"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={cadastroEmail}
                    onChange={(e) => setCadastroEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={cadastroSenha}
                    onChange={(e) => setCadastroSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartamento
                  </label>
                  <select
                    value={apartamento}
                    onChange={(e) => setApartamento(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] bg-white"
                  >
                    <option value="">Selecione o apartamento</option>
                    {APARTAMENTOS.map((apto) => (
                      <option key={apto} value={apto}>
                        Apto {apto}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-gray-400 -mt-1">
                  Condomínio: Edifício Moema Park
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-1"
                  style={{ backgroundColor: '#10b981' }}
                >
                  {loading ? 'Cadastrando...' : 'Criar conta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
