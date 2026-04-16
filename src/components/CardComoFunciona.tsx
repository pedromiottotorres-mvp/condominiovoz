'use client'

import { useState } from 'react'
import { Lightbulb } from 'lucide-react'

const PASSOS = [
  {
    num: 1,
    titulo: 'Registre o que importa pra você',
    texto: 'Crie uma demanda descrevendo o que precisa ser feito no condomínio.',
  },
  {
    num: 2,
    titulo: 'Apoie UMA prioridade',
    texto: 'Você pode apoiar apenas uma demanda por ciclo. Escolha a que mais importa para você e sua família.',
  },
  {
    num: 3,
    titulo: 'As mais apoiadas serão executadas',
    texto: 'O orçamento será usado primeiro na demanda mais votada. Com o que sobrar, a próxima é atendida, e assim por diante.',
  },
]

export default function CardComoFunciona() {
  const [expandido, setExpandido] = useState(true)

  if (!expandido) {
    return (
      <button
        onClick={() => setExpandido(true)}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          background: 'none', border: 'none', padding: '0 0 20px',
          cursor: 'pointer', fontSize: '0.85rem',
          color: 'var(--gray-400)', fontFamily: 'var(--font-body)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--navy)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-400)' }}
      >
        ℹ️ Como funciona o ciclo?
      </button>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(160deg, #ffffff 0%, var(--gray-50) 100%)',
      border: '1px solid var(--gray-100)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 12px rgba(15,36,64,0.05)',
    }}>
      {/* Ícone */}
      <div style={{ marginBottom: '14px' }}>
        <Lightbulb size={32} style={{ color: 'var(--mint-dark)' }} strokeWidth={1.75} />
      </div>

      {/* Título */}
      <h3 style={{
        fontFamily: 'var(--font-body)', fontWeight: 700,
        fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '20px',
      }}>
        Como funciona?
      </h3>

      {/* Passos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        {PASSOS.map(({ num, titulo, texto }) => (
          <div key={num} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--navy)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff',
              fontFamily: 'var(--font-body)',
            }}>
              {num}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', margin: 0 }}>
              <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', margin: '0 0 2px' }}>
                {titulo}
              </p>
              <p style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                {texto}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <p style={{
        fontSize: '0.8rem', color: 'var(--gray-400)',
        fontFamily: 'var(--font-body)', fontStyle: 'italic',
        marginBottom: '20px',
      }}>
        O síndico define os custos e gerencia a execução.
      </p>

      {/* Botão Entendi */}
      <button
        onClick={() => setExpandido(false)}
        style={{
          padding: '8px 20px', borderRadius: '10px',
          fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          cursor: 'pointer', background: 'transparent',
          border: '1.5px solid var(--mint)', color: 'var(--mint-dark)',
          transition: 'all 0.2s var(--ease-spring)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'var(--mint-pale)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'transparent'
        }}
      >
        Entendi ✓
      </button>
    </div>
  )
}
