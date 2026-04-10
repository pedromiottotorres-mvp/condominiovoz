'use client'

import { useState } from 'react'
import { Copy, MessageCircle, Check } from 'lucide-react'

interface Props {
  codigo: string
  condoNome: string
}

export default function CodigoConviteCard({ codigo, condoNome }: Props) {
  const [copiado, setCopiado] = useState(false)

  function formatarCodigo(c: string) {
    return c.split('').join(' ')
  }

  async function copiar() {
    await navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function compartilharWhatsApp() {
    const msg = encodeURIComponent(
      `Olá! Estou usando o CondomínioVoz para gerenciar nosso condomínio (${condoNome}).\n\nCadastre-se em https://condominiovoz.vercel.app e use o código *${codigo}* para entrar.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--gray-100)',
        boxShadow: 'var(--shadow-card)',
        padding: '24px',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
            Código de Convite
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
            Compartilhe com os moradores para que possam se cadastrar
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--mint-pale)' }}
        >
          <MessageCircle size={18} style={{ color: 'var(--mint-dark)' }} />
        </div>
      </div>

      {/* Código em destaque */}
      <div
        className="flex items-center justify-center py-5 mb-5 rounded-2xl"
        style={{ background: 'var(--navy-pale)', border: '2px dashed var(--navy)' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'var(--navy)',
            letterSpacing: '0.3em',
            lineHeight: 1,
          }}
        >
          {formatarCodigo(codigo)}
        </span>
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          onClick={copiar}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: copiado ? 'var(--mint-pale)' : 'var(--navy)',
            color: copiado ? 'var(--mint-dark)' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background 0.2s',
          }}
        >
          {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar código</>}
        </button>

        <button
          onClick={compartilharWhatsApp}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'transparent',
            color: '#25d366',
            border: '2px solid #25d366',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          <MessageCircle size={15} />
          WhatsApp
        </button>
      </div>
    </div>
  )
}
