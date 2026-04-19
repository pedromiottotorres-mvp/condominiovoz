'use client'

import { useState, useEffect } from 'react'
import { Smartphone } from 'lucide-react'

export default function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!mounted || isInstalled) return null

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else if (isIOS) {
      setShowIOSTip((v) => !v)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
      borderRadius: '20px',
      padding: '24px',
      color: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <Smartphone size={32} style={{ color: 'var(--mint)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '6px',
          }}>
            Instale o CondomínioVoz
          </h3>
          <p style={{
            fontSize: '0.9rem',
            opacity: 0.8,
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
            marginBottom: '16px',
          }}>
            Acesse direto da tela inicial do seu celular, sem precisar abrir o navegador.
          </p>
          {(deferredPrompt || isIOS) && (
            <button
              onClick={handleInstall}
              style={{
                background: 'var(--mint)',
                color: 'var(--navy)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              Instalar
            </button>
          )}
        </div>
      </div>

      {showIOSTip && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.5,
        }}>
          No Safari, toque no ícone de compartilhar (quadrado com seta) e depois em &quot;Adicionar à Tela Inicial&quot;
        </div>
      )}
    </div>
  )
}
