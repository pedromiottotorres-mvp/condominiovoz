'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const SESSION_KEY = 'install_banner_dismissed'
const LANDING_PATHS = ['/', '/login', '/aguardando-aprovacao']

export default function InstallBanner() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Não mostrar na landing, login ou aguardando
    if (LANDING_PATHS.includes(pathname)) return

    // Não mostrar se já está instalado (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Não mostrar se foi dispensado nesta sessão
    if (sessionStorage.getItem(SESSION_KEY)) return

    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS Safari: mostrar banner com instruções manuais
      setVisible(true)
      return
    }

    // Android/Chrome: aguardar o evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [pathname])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleInstall() {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 64, // acima do BottomNav
      left: 0,
      right: 0,
      zIndex: 60,
      padding: '0 12px 8px',
    }}>
      <div style={{
        background: '#0f2744',
        borderRadius: '16px 16px 16px 16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 -4px 24px rgba(15,39,68,0.3)',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        {/* Ícone do app */}
        <img
          src="/icons/icon-192x192.png"
          alt="CondomínioVoz"
          width={36}
          height={36}
          style={{ borderRadius: '8px', flexShrink: 0 }}
        />

        {/* Textos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {showIOSInstructions ? (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
              Toque em <strong style={{ color: '#fff' }}>Compartilhar</strong> e depois{' '}
              <strong style={{ color: '#fff' }}>"Adicionar à Tela Inicial"</strong>
            </p>
          ) : (
            <>
              <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                Instale o CondomínioVoz
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '2px 0 0', lineHeight: 1.3 }}>
                Acesse direto da sua tela inicial
              </p>
            </>
          )}
        </div>

        {/* Botão instalar */}
        {!showIOSInstructions && (
          <button
            onClick={handleInstall}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Instalar
          </button>
        )}

        {/* Botão fechar */}
        <button
          onClick={dismiss}
          aria-label="Fechar"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
