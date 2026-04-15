'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Camera, X, Loader2,
  Wrench, Shield, Palmtree, Paintbrush, Building, HelpCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Categoria } from '@/components/DemandaCard'

type CicloInfo = { id: string; nome: string; fase: string } | null

const CATEGORIAS: {
  value: Categoria; label: string; emoji: string
  Icon: React.ElementType; bg: string; color: string; border: string
}[] = [
  { value: 'manutencao', label: 'Manutenção', emoji: '🔧', Icon: Wrench,     bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  { value: 'seguranca',  label: 'Segurança',  emoji: '🔒', Icon: Shield,     bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  { value: 'lazer',      label: 'Lazer',      emoji: '🎾', Icon: Palmtree,   bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  { value: 'estetica',   label: 'Estética',   emoji: '🎨', Icon: Paintbrush, bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' },
  { value: 'estrutural', label: 'Estrutural', emoji: '🏗️', Icon: Building,   bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
  { value: 'outro',      label: 'Outro',      emoji: '📋', Icon: HelpCircle, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
]

export default function NovaDemandaPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('manutencao')
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ciclo, setCiclo] = useState<CicloInfo>(undefined as unknown as CicloInfo)

  const [tituloFocused, setTituloFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)

  useEffect(() => {
    async function fetchCiclo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('condominio_id').eq('id', user.id).single()
      if (!profile?.condominio_id) { setCiclo(null); return }
      const { data } = await supabase
        .from('ciclos')
        .select('id, nome, fase')
        .eq('condominio_id', profile.condominio_id)
        .not('fase', 'in', '(encerrado)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setCiclo(data ?? null)
    }
    fetchCiclo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErro('A foto deve ter no máximo 5MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErro('Formato inválido. Use JPG, PNG ou WEBP.'); return
    }
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
    setErro('')
  }

  function removerFoto() {
    setFoto(null)
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setErro('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('condominio_id').eq('id', user.id).single()

    if (!profile?.condominio_id) {
      setErro('Não foi possível identificar seu condomínio. Tente novamente.')
      setLoading(false); return
    }

    let foto_url: string | null = null

    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('demandas-fotos').upload(path, foto, { contentType: foto.type })

      if (uploadError) {
        setErro('Erro ao enviar a foto. Tente novamente.')
        setLoading(false); return
      }

      const { data: urlData } = supabase.storage.from('demandas-fotos').getPublicUrl(path)
      foto_url = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('demandas').insert({
      condominio_id: profile.condominio_id,
      autor_id: user.id,
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim() || null,
      foto_url,
      custo_estimado: null,
      ciclo_id: ciclo?.fase === 'demandas' ? ciclo.id : null,
    })

    if (insertError) {
      setErro('Erro ao publicar demanda. Tente novamente.')
      setLoading(false); return
    }

    router.push('/demandas')
    router.refresh()
  }

  const inputBase: React.CSSProperties = {
    width: '100%', background: '#fff',
    border: '2px solid var(--gray-200)', borderRadius: '12px',
    padding: '14px 16px', fontFamily: 'var(--font-body)',
    color: 'var(--gray-800)', outline: 'none',
    transition: 'border-color 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--navy)' }}>
            Nova Demanda
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 80px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {erro && (
            <div style={{
              padding: '14px 16px', borderRadius: '12px', fontSize: '0.875rem',
              background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626',
              fontFamily: 'var(--font-body)',
            }}>
              {erro}
            </div>
          )}

          {/* Título */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Título <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text" required maxLength={100}
              value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Iluminação da garagem precisa de reparo"
              style={{
                ...inputBase, fontSize: '1.05rem',
                borderColor: tituloFocused ? 'var(--navy)' : 'var(--gray-200)',
                boxShadow: tituloFocused ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
              }}
              onFocus={() => setTituloFocused(true)}
              onBlur={() => setTituloFocused(false)}
            />
            <p style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              {titulo.length}/100
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '10px', fontFamily: 'var(--font-body)' }}>
              Categoria <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORIAS.map(({ value, label, emoji, bg, color, border }) => {
                const ativo = categoria === value
                return (
                  <button
                    key={value} type="button"
                    onClick={() => setCategoria(value)}
                    style={{
                      padding: '10px 8px', borderRadius: '50px',
                      border: `2px solid ${ativo ? border : 'var(--gray-200)'}`,
                      background: ativo ? bg : '#fff',
                      color: ativo ? color : 'var(--gray-500)',
                      fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s var(--ease-spring)',
                      transform: ativo ? 'scale(1.03)' : 'scale(1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{emoji}</span>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ciclo banner */}
          {ciclo !== undefined && (
            ciclo === null ? (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem',
                background: 'var(--gray-100)', border: '1px solid var(--gray-200)',
                color: 'var(--gray-500)', fontFamily: 'var(--font-body)', lineHeight: 1.5,
              }}>
                Não há ciclo ativo. Sua demanda será registrada sem vínculo a um ciclo.
              </div>
            ) : ciclo.fase === 'demandas' ? (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem',
                background: 'var(--mint-pale)', border: '1px solid var(--mint)',
                color: 'var(--mint-dark)', fontFamily: 'var(--font-body)', lineHeight: 1.5,
              }}>
                Esta demanda será vinculada ao ciclo <strong>{ciclo.nome}</strong>.
              </div>
            ) : (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem',
                background: '#fff7ed', border: '1px solid #fed7aa',
                color: '#c2410c', fontFamily: 'var(--font-body)', lineHeight: 1.5,
              }}>
                O ciclo <strong>{ciclo.nome}</strong> está em fase de <strong>{ciclo.fase === 'votacao' ? 'votação' : ciclo.fase}</strong>. Novas demandas não serão vinculadas a este ciclo.
              </div>
            )
          )}

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Descrição
            </label>
            <textarea
              maxLength={500} value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema ou sugestão em detalhes..."
              rows={4}
              style={{
                ...inputBase, resize: 'none', lineHeight: 1.6,
                borderColor: descFocused ? 'var(--navy)' : 'var(--gray-200)',
                boxShadow: descFocused ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
              }}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
            <p style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              {descricao.length}/500
            </p>
          </div>

          {/* Foto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '10px', fontFamily: 'var(--font-body)' }}>
              Foto <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--gray-400)' }}>(opcional)</span>
            </label>
            {fotoPreview ? (
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                <Image src={fotoPreview} alt="Preview" width={600} height={300} className="w-full h-48 object-cover" />
                <button
                  type="button" onClick={removerFoto}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={15} color="#fff" />
                </button>
              </div>
            ) : (
              <button
                type="button" onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '32px 24px',
                  border: '2px dashed var(--gray-200)', borderRadius: '16px',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-300)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <Camera size={28} style={{ color: 'var(--gray-300)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--gray-400)', fontSize: '0.9rem' }}>
                  Adicionar foto
                </span>
                <span style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-300)', fontSize: '0.8rem' }}>
                  JPG, PNG ou WEBP · máx 5MB
                </span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFoto} style={{ display: 'none' }} />
          </div>

          {/* Botão publicar */}
          <button
            type="submit"
            disabled={loading || !titulo.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'var(--navy)', color: '#fff', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
              cursor: loading || !titulo.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !titulo.trim() ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.15s var(--ease-spring), box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading && titulo.trim()) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = ''
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
            }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Publicando...</> : 'Publicar Demanda'}
          </button>
        </form>
      </main>
    </div>
  )
}
