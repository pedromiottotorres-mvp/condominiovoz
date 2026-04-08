'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Categoria } from '@/components/DemandaCard'

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'estetica', label: 'Estética' },
  { value: 'estrutural', label: 'Estrutural' },
  { value: 'outro', label: 'Outro' },
]

const CONDOMINIO_ID = 'a0000000-0000-0000-0000-000000000001'

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
      condominio_id: CONDOMINIO_ID,
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

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
            Nova Demanda
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {erro}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Descreva o problema em poucas palavras"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {titulo.length}/100
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria <span className="text-red-400">*</span>
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] bg-white"
            >
              {CATEGORIAS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              maxLength={500}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe o problema, localização, quando ocorre..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {descricao.length}/500
            </p>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto (opcional)
            </label>

            {fotoPreview ? (
              <div className="relative rounded-xl overflow-hidden">
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
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                <Camera size={24} />
                <span className="text-xs">Toque para adicionar foto</span>
                <span className="text-xs">JPG, PNG ou WEBP · máx 5MB</span>
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
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Demanda'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
