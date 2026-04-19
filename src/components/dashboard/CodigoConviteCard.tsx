'use client'

import { useState, useRef } from 'react'
import { Copy, MessageCircle, Check, QrCode, X, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  codigo: string
  condoNome: string
}

export default function CodigoConviteCard({ codigo, condoNome }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const qrRef = useRef<SVGSVGElement>(null)

  const qrUrl = `https://condominiovoz.vercel.app/login?tab=morador&codigo=${codigo}`

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

  function baixarQRCode() {
    const svg = qrRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 240
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 20, 20, size - 40, size - 40)
      const link = document.createElement('a')
      link.download = `qrcode-${codigo}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
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
            {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar</>}
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

          <button
            onClick={() => setShowQR(true)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'transparent',
              color: 'var(--navy)',
              border: '2px solid var(--navy)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            <QrCode size={15} />
            QR Code
          </button>
        </div>
      </div>

      {/* Modal QR Code */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,36,64,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 24px 64px rgba(15,36,64,0.2)',
              maxWidth: '360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowQR(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gray-400)', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--navy)',
              textAlign: 'center',
              margin: 0,
            }}>
              QR Code do Condomínio
            </h3>

            <div style={{
              padding: '16px',
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid var(--gray-100)',
            }}>
              <QRCodeSVG
                ref={qrRef}
                value={qrUrl}
                size={200}
              />
            </div>

            <p style={{
              fontSize: '0.85rem',
              color: 'var(--gray-500)',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Peça aos moradores para escanear com a câmera do celular
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={baixarQRCode}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px 16px',
                  background: 'var(--navy)', color: '#fff',
                  border: 'none', borderRadius: '12px',
                  fontSize: '0.875rem', fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} />
                Baixar QR Code
              </button>

              <button
                onClick={() => setShowQR(false)}
                style={{
                  padding: '12px 16px',
                  background: 'none', color: 'var(--gray-500)',
                  border: '1.5px solid var(--gray-200)', borderRadius: '12px',
                  fontSize: '0.875rem', fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
