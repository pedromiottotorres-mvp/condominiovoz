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

  if (pathname === '/') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
              style={{ color: isActive ? '#1e3a5f' : '#9ca3af' }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? '#1e3a5f' : '#9ca3af' }}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
