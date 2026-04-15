'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Vote, User, LayoutDashboard } from 'lucide-react'

interface BottomNavProps {
  isSindico?: boolean
}

const navItems = [
  { href: '/demandas', label: 'Demandas', icon: Home },
  { href: '/votacoes', label: 'Votações', icon: Vote },
  { href: '/perfil', label: 'Perfil', icon: User },
]

const sindicoItem = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
}

export default function BottomNav({ isSindico = false }: BottomNavProps) {
  const pathname = usePathname()
  const items = isSindico ? [...navItems, sindicoItem] : navItems

  const HIDE_PATHS = ['/', '/login', '/aguardando-aprovacao']
  if (HIDE_PATHS.includes(pathname)) return null

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: '1px solid var(--gray-100)',
      boxShadow: '0 -4px 16px rgba(15,36,64,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', height: '64px', maxWidth: '480px', margin: '0 auto' }}>
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--navy)' : 'var(--gray-400)',
                transition: 'color 0.2s',
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? 'var(--navy)' : 'var(--gray-400)' }}
              />
              <span style={{
                fontSize: '0.7rem', fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-body)',
                color: isActive ? 'var(--navy)' : 'var(--gray-400)',
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
