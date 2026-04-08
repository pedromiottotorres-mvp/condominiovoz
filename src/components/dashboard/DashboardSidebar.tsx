'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Vote,
  Users,
  DollarSign,
  FileText,
  Building2,
} from 'lucide-react'

interface Props {
  condominioNome: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/votacoes', label: 'Votações', icon: Vote, exact: false },
  { href: '/dashboard/moradores', label: 'Moradores', icon: Users, exact: false },
  { href: '/dashboard/orcamento', label: 'Orçamento', icon: DollarSign, exact: false },
  { href: '/dashboard/relatorio', label: 'Relatório', icon: FileText, exact: false },
]

export default function DashboardSidebar({ condominioNome }: Props) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-[#1e3a5f] z-50">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">CondomínioVoz</p>
            <p className="text-white/50 text-xs truncate">{condominioNome}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <Link
          href="/"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          ← Ir para demandas
        </Link>
      </div>
    </aside>
  )
}
