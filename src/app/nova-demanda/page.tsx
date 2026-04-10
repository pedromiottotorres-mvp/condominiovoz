'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Camera, X, Loader2, Wrench, Shield, Palmtree, Paintbrush, Building, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Categoria } from '@/components/DemandaCard'

const CATEGORIAS: { value: Categoria; label: string; Icon: React.ElementType; cssClass: string }[] = [
  { value: 'manutencao', label: 'Manutenção', Icon: Wrench,     cssClass: 'badge-manutencao' },
  { value: 'seguranca',  label: 'Segurança',  Icon: Shield,     cssClass: 'badge-seguranca'  },
  { value: 'lazer',      label: 'Lazer',      Icon: Palmtree,   cssClass: 'badge-lazer'      },
  { value: 'estetica',   label: 'Estética',   Icon: Paintbrush, cssClass: 'badge-estetica'   },
  { value: 'estrutural', label: 'Estrutural', Icon: Building,   cssClass: 'badge-estrutural' },
  { value: 'outro',      label: 'Outro',      Icon: HelpCircle, cssClass: 'badge-outro'      },
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

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErro('A foto deve ter no máximo 5MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErro('Formato inválido. Use JPG, PNG ou WEBP.')
      return
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('condominio_id')
      .eq('id', user.id)
      .single()

    if (!profile?.condominio_id) {
      setErro('Não foi possível identificar seu condomínio. Tente novamente.')
      setLoading(false)
      return
    }

    let foto_url: string | null = null

    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('demandas-fotos')
        .upload(path, foto, { contentType: foto.type })

      if (uploadError) {
        setErro('Erro ao enviar a foto. Tente novamente.')
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('demandas-fotos')
        .getPublicUrl(path)

      foto_url = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('demandas').insert({
      condominio_id: profile.condominio_id,
      autor_id: user.id,
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim() || null,
      foto_url,
    })

    if (insertError) {
      setErro('Erro ao publicar demanda. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/demandas')
    router.refresh()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--gray-100)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </button>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              color: 'var(--navy)',
            }}
          >
            Nova Demanda
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-16">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {erro && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                color: '#c53030',
                fontFamily: 'var(--font-body)',
              }}
            >
              {erro}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="app-label">
              Título <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Iluminação da garagem está queimada..."
              className="app-input"
            />
            <p
              className="text-right mt-1"
              style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
            >
              {titulo.length}/100
            </p>
          </div>

          {/* Categoria — pills clicáveis */}
          <div>
            <label className="app-label">Categoria <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIAS.map(({ value, label, Icon, cssClass }) => {
                const ativo = categoria === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategoria(value)}
                    className={`badge ${cssClass}`}
                    style={{
                      padding: '7px 14px',
                      cursor: 'pointer',
                      fontSize: '0.8375rem',
                      outline: ativo ? '2px solid currentColor' : 'none',
                      outlineOffset: '2px',
                      opacity: ativo ? 1 : 0.7,
                      transition: 'all 0.15s var(--ease-spring)',
                      transform: ativo ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="app-label">Descrição</label>
            <textarea
              maxLength={500}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe o problema, localização, quando ocorre..."
              rows={4}
              className="app-input"
              style={{ resize: 'none' }}
            />
            <p
              className="text-right mt-1"
              style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
            >
              {descricao.length}/500
            </p>
          </div>

          {/* Foto */}
          <div>
            <label className="app-label">Foto (opcional)</label>
            {fotoPreview ? (
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <Image
                  src={fotoPreview}
                  alt="Preview"
                  width={600}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removerFoto}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <X size={15} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 flex flex-col items-center justify-center gap-2 transition-colors"
                style={{
                  border: '2px dashed var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--gray-400)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-300)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <Camera size={22} />
                <span style={{ fontSize: '0.8375rem' }}>Toque para adicionar foto</span>
                <span style={{ fontSize: '0.75rem' }}>JPG, PNG ou WEBP · máx 5MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFoto}
              className="hidden"
            />
          </div>

          {/* Botão publicar */}
          <button
            type="submit"
            disabled={loading || !titulo.trim()}
            className="btn-primary w-full"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Publicando...</>
            ) : (
              'Publicar Demanda'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
