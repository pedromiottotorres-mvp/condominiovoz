'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

// ─── Intersection Observer Hook ───
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, isInView] as const;
}

// ─── Animated Counter ───
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

// ─── Fade In Component ───
function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}) {
  const [ref, inView] = useInView();
  const transforms: Record<string, string> = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    none: 'none',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : transforms[direction],
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Icons (inline SVG) ───
const Icons = {
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  vote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ═══ GLOBAL STYLES ═══ */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display:ital@0;1&display=swap');

        :root {
          --navy: #1e3a5f;
          --navy-deep: #0f2440;
          --navy-light: #2a4d78;
          --mint: #10b981;
          --mint-light: #34d399;
          --mint-pale: #d1fae5;
          --mint-glow: rgba(16, 185, 129, 0.15);
          --cream: #faf9f7;
          --cv-white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --shadow-sm: 0 1px 2px rgba(15, 36, 64, 0.05);
          --shadow-md: 0 4px 16px rgba(15, 36, 64, 0.08);
          --shadow-lg: 0 8px 32px rgba(15, 36, 64, 0.12);
          --shadow-xl: 0 16px 48px rgba(15, 36, 64, 0.16);
        }
      `}</style>

      <div
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--gray-800)',
          background: 'var(--cream)',
          overflowX: 'hidden',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* ═══ NAV ═══ */}
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: '0 24px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
            background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            boxShadow: scrolled ? '0 1px 0 rgba(30,58,95,0.08)' : 'none',
          }}
        >
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              color: 'var(--navy)',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-light)',
              }}
            >
              {Icons.building}
            </span>
            CondomínioVoz
          </a>

          {/* Desktop Links */}
          <div
            className="nav-desktop-links"
            style={{ display: 'flex', alignItems: 'center', gap: 32 }}
          >
            {[
              ['Problema', '#problema'],
              ['Funcionalidades', '#funcionalidades'],
              ['Como Funciona', '#como-funciona'],
              ['Preço', '#preco'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--gray-600)',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="/login"
              style={{
                padding: '10px 24px',
                borderRadius: 50,
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'var(--navy)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Começar Agora
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="nav-mobile-btn"
            onClick={() => setMobileOpen(true)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--navy)',
              cursor: 'pointer',
            }}
          >
            {Icons.menu}
          </button>
        </nav>

        {/* Mobile Overlay */}
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15,36,64,0.5)',
            backdropFilter: 'blur(4px)',
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 201,
              width: 300,
              background: 'white',
              padding: 24,
              transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--gray-600)', cursor: 'pointer' }}
              >
                {Icons.close}
              </button>
            </div>
            {['Problema', 'Funcionalidades', 'Como Funciona', 'Preço'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '16px 0',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'var(--gray-700)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--gray-100)',
                }}
              >
                {item}
              </a>
            ))}
            <a
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                marginTop: 24,
                padding: 14,
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'var(--navy)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Começar Agora
            </a>
          </div>
        </div>

        {/* ═══ HERO ═══ */}
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 24px 80px',
            position: 'relative',
            background: 'linear-gradient(180deg, var(--cream) 0%, var(--cv-white) 100%)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -200,
              right: -200,
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30,58,95,0.05) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <FadeIn>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  borderRadius: 50,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: 'var(--mint-pale)',
                  color: '#047857',
                  marginBottom: 32,
                  letterSpacing: '-0.01em',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--mint)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }}
                />
                Plataforma de governança para condomínios
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
                  lineHeight: 1.1,
                  color: 'var(--navy-deep)',
                  marginBottom: 24,
                  letterSpacing: '-0.02em',
                }}
              >
                A voz dos moradores,
                <br />a{' '}
                <em
                  style={{
                    fontStyle: 'italic',
                    background: 'linear-gradient(135deg, var(--mint) 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  decisão
                </em>{' '}
                do síndico.
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                  lineHeight: 1.7,
                  color: 'var(--gray-500)',
                  maxWidth: 620,
                  margin: '0 auto 40px',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                Transforme reclamações em prioridades rankeadas e saiba exatamente onde investir o
                orçamento do condomínio, com a participação real de quem mora lá.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '16px 32px',
                    borderRadius: 14,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    background: 'var(--navy)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                  }}
                >
                  Testar Gratuitamente {Icons.arrowRight}
                </a>
                <a
                  href="#como-funciona"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '16px 32px',
                    borderRadius: 14,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    background: 'transparent',
                    color: 'var(--navy)',
                    border: '2px solid var(--gray-200)',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                  }}
                >
                  Ver como funciona
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.5}>
              <div
                style={{
                  marginTop: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  color: 'var(--gray-400)',
                  fontSize: '0.85rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>R$ 5/unidade por mês</span>
                <span style={{ width: 1, height: 20, background: 'var(--gray-200)' }} />
                <span>Sem taxa de setup</span>
                <span style={{ width: 1, height: 20, background: 'var(--gray-200)' }} />
                <span>Cancele quando quiser</span>
              </div>
            </FadeIn>
          </div>
          <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }`}</style>
        </section>

        {/* ═══ PROBLEM ═══ */}
        <section
          id="problema"
          style={{ padding: '100px 24px', background: 'var(--cv-white)' }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="problem-grid" style={{ display: 'grid', gap: 64, alignItems: 'center' }}>
              <div>
                <FadeIn>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--mint)',
                      marginBottom: 16,
                    }}
                  >
                    O Problema
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                      lineHeight: 1.15,
                      color: 'var(--navy-deep)',
                      marginBottom: 20,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Todo condomínio tem dinheiro.
                    <br />
                    Nenhum sabe onde investir.
                  </h2>
                  <p
                    style={{
                      fontSize: '1.1rem',
                      lineHeight: 1.7,
                      color: 'var(--gray-500)',
                      maxWidth: 600,
                      marginBottom: 48,
                    }}
                  >
                    Síndicos recebem dezenas de reclamações por mês, mas não têm como medir o que
                    realmente importa para os moradores. Resultado: decisões no escuro, assembleias
                    caóticas e moradores insatisfeitos.
                  </p>
                </FadeIn>

                {[
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    ),
                    title: 'Reclamações no WhatsApp se perdem',
                    desc: 'Mensagens enterradas em grupos. Sem registro, sem prioridade, sem acompanhamento.',
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    ),
                    title: 'Assembleias decidem por quem grita mais',
                    desc: 'Sem dados, quem comparece e fala mais alto vence. A maioria silenciosa fica sem voz.',
                  },
                ].map((card, i) => (
                  <FadeIn key={i} delay={0.15 + i * 0.1}>
                    <div
                      style={{
                        padding: 32,
                        borderRadius: 20,
                        border: '1px solid var(--gray-100)',
                        background: 'var(--gray-50)',
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 16,
                          color: '#dc2626',
                          background: '#fef2f2',
                        }}
                      >
                        {card.icon}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 8 }}>
                        {card.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--gray-500)' }}>{card.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.3} direction="left">
                <div
                  style={{
                    padding: 32,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
                    color: 'white',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: 50,
                      background: 'rgba(16,185,129,0.2)',
                      color: 'var(--mint-light)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: 20,
                    }}
                  >
                    A Solução
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 16 }}>
                    CondomínioVoz transforma ruído em dados.
                  </h3>
                  <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.85 }}>
                    Moradores registram demandas e votam no que importa. O síndico vê um ranking claro de
                    prioridades. O sistema recomenda onde alocar cada real do orçamento.
                  </p>
                  <p style={{ marginTop: 20, fontWeight: 600, opacity: 1, fontSize: '1rem' }}>
                    Nenhum concorrente oferece isso.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="funcionalidades" style={{ padding: '100px 24px', background: 'var(--cream)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <FadeIn>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--mint)',
                  marginBottom: 16,
                }}
              >
                Funcionalidades
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  lineHeight: 1.15,
                  color: 'var(--navy-deep)',
                  marginBottom: 48,
                  letterSpacing: '-0.02em',
                }}
              >
                Tudo que seu condomínio precisa
                <br />
                para decidir melhor.
              </h2>
            </FadeIn>
            <div className="features-grid" style={{ display: 'grid', gap: 24 }}>
              {[
                {
                  icon: Icons.megaphone,
                  title: 'Portal de Demandas',
                  desc: 'Moradores registram pedidos com título, descrição, categoria e foto. Tudo organizado em um feed visual.',
                },
                {
                  icon: Icons.users,
                  title: 'Apoio Coletivo',
                  desc: 'Sistema de upvote: moradores apoiam demandas de outros. Quanto mais apoios, maior a prioridade.',
                },
                {
                  icon: Icons.vote,
                  title: 'Votações Oficiais',
                  desc: 'O síndico cria pautas com prazo e opções. Um voto por apartamento. Resultado transparente com quórum.',
                },
                {
                  icon: Icons.chart,
                  title: 'Dashboard Inteligente',
                  desc: 'Métricas em tempo real: demandas mais apoiadas, categorias críticas, índice de saúde do condomínio.',
                },
                {
                  icon: Icons.wallet,
                  title: 'Simulador de Orçamento',
                  desc: 'Informe o orçamento disponível e o sistema sugere alocação inteligente baseada nas prioridades reais.',
                },
                {
                  icon: Icons.shield,
                  title: 'Relatório para Assembleia',
                  desc: 'PDF completo com ranking de demandas, resultados de votações e proposta de orçamento. Pronto para apresentar.',
                },
              ].map((f, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div
                    className="feature-card-item"
                    style={{
                      padding: '36px 28px',
                      borderRadius: 20,
                      background: 'var(--cv-white)',
                      border: '1px solid var(--gray-100)',
                      transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        color: 'var(--navy)',
                        background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--mint-pale) 100%)',
                      }}
                    >
                      {f.icon}
                    </div>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--navy-deep)',
                        marginBottom: 10,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--gray-500)' }}>{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="como-funciona" style={{ padding: '100px 24px', background: 'var(--cv-white)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--mint)',
                    marginBottom: 16,
                  }}
                >
                  Como Funciona
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                    lineHeight: 1.15,
                    color: 'var(--navy-deep)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Do caos à clareza em 4 passos.
                </h2>
              </div>
            </FadeIn>
            <div className="how-steps-grid" style={{ display: 'grid', gap: 32, position: 'relative' }}>
              {[
                { num: '1', title: 'Síndico contrata', desc: 'Cadastro em 2 minutos. Recebe código de convite para os moradores.' },
                { num: '2', title: 'Moradores registram', desc: 'Cada morador cria demandas e apoia as dos vizinhos pelo celular.' },
                { num: '3', title: 'Prioridades emergem', desc: 'O ranking se forma sozinho: o que mais importa sobe ao topo.' },
                { num: '4', title: 'Síndico decide', desc: 'Dashboard com dados claros + simulador de orçamento para alocar recursos.' },
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.12}>
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        margin: '0 auto 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        color: 'var(--navy)',
                        background: 'var(--cv-white)',
                        border: '2px solid var(--gray-200)',
                      }}
                    >
                      {s.num}
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-deep)', marginBottom: 8 }}>
                      {s.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--gray-500)' }}>{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy) 60%, var(--navy-light) 100%)',
            color: 'white',
            padding: '80px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            }}
          />
          <div
            className="stats-grid"
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gap: 32,
              textAlign: 'center',
            }}
          >
            {[
              { value: 13.3, suffix: 'M', label: 'endereços em condomínios no Brasil' },
              { value: 39, suffix: 'M', label: 'moradores em condomínios' },
              { value: 516, suffix: '', label: 'taxa condominial média (R$/mês)' },
              { value: 0, suffix: 'zero', label: 'concorrentes em governança participativa' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--mint-light)', marginBottom: 8 }}>
                    {s.suffix === 'zero' ? 'ZERO' : <Counter end={s.value} suffix={s.suffix} />}
                  </h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.4 }}>{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="preco" style={{ padding: '100px 24px', background: 'var(--cream)', textAlign: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <FadeIn>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--mint)',
                  marginBottom: 16,
                }}
              >
                Preço Simples
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  lineHeight: 1.15,
                  color: 'var(--navy-deep)',
                  marginBottom: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                Menos que um café por morador.
              </h2>
              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  color: 'var(--gray-500)',
                  maxWidth: 600,
                  margin: '0 auto 48px',
                }}
              >
                Preço único, transparente, sem surpresas. Pague pelo tamanho do seu condomínio.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div
                style={{
                  maxWidth: 520,
                  margin: '0 auto',
                  padding: '48px 40px',
                  borderRadius: 24,
                  background: 'var(--cv-white)',
                  border: '2px solid var(--gray-100)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 24px',
                    borderRadius: 50,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--mint) 0%, #059669 100%)',
                    color: 'white',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔥 Preço de Fundador · Vagas Limitadas
                </div>
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>R$</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '4rem',
                      color: 'var(--navy-deep)',
                      lineHeight: 1,
                    }}
                  >
                    5
                  </span>
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--gray-400)', marginTop: 4 }}>por unidade / mês</div>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--gray-50)',
                    fontSize: '0.9rem',
                    color: 'var(--gray-600)',
                    margin: '24px 0',
                  }}
                >
                  Exemplo: condomínio com 48 unidades ={' '}
                  <strong style={{ color: 'var(--navy)' }}>R$ 240/mês</strong>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                    Apenas 0,3% do orçamento condominial
                  </span>
                </div>
                <div style={{ textAlign: 'left', margin: '24px 0 32px' }}>
                  {[
                    'Portal de demandas com ranking por apoio',
                    'Votações oficiais com controle de quórum',
                    'Dashboard completo com métricas',
                    'Simulador de orçamento inteligente',
                    'Relatório PDF para assembleia',
                    'Preço travado por 24 meses',
                    'Novas features incluídas sem custo',
                    'Sem taxa de setup, sem fidelidade',
                  ].map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        fontSize: '0.95rem',
                        color: 'var(--gray-700)',
                      }}
                    >
                      <span style={{ color: 'var(--mint)', flexShrink: 0 }}>{Icons.check}</span>
                      {f}
                    </div>
                  ))}
                </div>
                <a
                  href="/login"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 16,
                    borderRadius: 14,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'var(--navy)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Começar Agora · Teste Grátis
                </a>
                <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  Sem cartão de crédito. Cancele a qualquer momento.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ CTA FINAL ═══ */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy) 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '100px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 60%)',
            }}
          />
          <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <FadeIn>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  marginBottom: 20,
                  lineHeight: 1.15,
                }}
              >
                Seu condomínio já tem voz.
                <br />
                Agora precisa ser ouvido.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p style={{ fontSize: '1.1rem', opacity: 0.75, marginBottom: 36, lineHeight: 1.6 }}>
                Comece em minutos. Sem instalação, sem complexidade.
                <br />
                Seus moradores vão agradecer.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <a
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '18px 40px',
                  borderRadius: 14,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  background: 'var(--mint)',
                  color: 'var(--navy-deep)',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  textDecoration: 'none',
                }}
              >
                Ativar CondomínioVoz {Icons.arrowRight}
              </a>
            </FadeIn>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer
          style={{
            padding: '48px 24px',
            background: 'var(--gray-900)',
            color: 'var(--gray-400)',
            textAlign: 'center',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'white', marginBottom: 16 }}>
            CondomínioVoz
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            {[
              ['Funcionalidades', '#funcionalidades'],
              ['Como Funciona', '#como-funciona'],
              ['Preço', '#preco'],
              ['Termos de Uso', '#'],
              ['Política de Privacidade', '#'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
          <p>&copy; 2026 CondomínioVoz. Todos os direitos reservados.</p>
          <p style={{ marginTop: 8, color: 'var(--gray-600)' }}>Feito em Moema, São Paulo 🇧🇷</p>
        </footer>

        {/* ═══ RESPONSIVE STYLES ═══ */}
        <style>{`
          .problem-grid { grid-template-columns: 1fr 1fr; }
          .features-grid { grid-template-columns: repeat(3, 1fr); }
          .how-steps-grid { grid-template-columns: repeat(4, 1fr); }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }

          @media (max-width: 900px) {
            .nav-desktop-links { display: none !important; }
            .nav-mobile-btn { display: block !important; }
            .problem-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            .features-grid { grid-template-columns: 1fr !important; }
            .how-steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 600px) {
            .how-steps-grid { grid-template-columns: 1fr !important; max-width: 300px; margin: 0 auto; }
            .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          }
        `}</style>
      </div>
    </>
  );
}
