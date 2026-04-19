'use client'

import { useState, useEffect } from 'react'
import { Smartphone } from 'lucide-react'

type Platform = 'ios' | 'android' | 'desktop'

type DeferredPrompt = Event & {
  prompt: () => void
  userChoice: Promise<{ outcome: string }>
}

export default function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null)
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [installed, setInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isAndroid = /Android/.test(ua)
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop')

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as DeferredPrompt)
      setShowInstructions(false)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!mounted || installed) return null

  const INSTRUCTIONS: Record<Platform, string> = {
    android: 'Abra o menu do Chrome (três pontos no canto superior) e toque em "Instalar aplicativo" ou "Adicionar à tela inicial"',
    ios: 'Toque no ícone de compartilhar (quadrado com seta) e depois em "Adicionar à Tela Inicial"',
    desktop: 'No Chrome, clique no ícone de instalação na barra de endereço',
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      setShowInstructions(true)
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
        </div>
      </div>

      {showInstructions && (
        <div style={{
          marginTop: '16px',
          padding: '20px',
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--navy)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            marginBottom: '14px',
          }}>
            {INSTRUCTIONS[platform]}
          </p>
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              background: 'var(--navy-pale)',
              color: 'var(--navy)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Entendi
          </button>
        </div>
      )}
    </div>
  )
}
