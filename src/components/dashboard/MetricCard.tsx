'use client'

import { useState } from 'react'
import { MessageSquare, Users, Vote, TrendingUp } from 'lucide-react'

const iconMap: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  MessageSquare,
  Users,
  Vote,
  TrendingUp,
}

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: string
  iconBg: string
  iconColor: string
  valueColor: string
}

export default function MetricCard({ label, value, sub, icon, iconBg, iconColor, valueColor }: MetricCardProps) {
  const [hovered, setHovered] = useState(false)
  const Icon = iconMap[icon] ?? MessageSquare

  return (
    <div
      style={{
        background: '#fff', borderRadius: '20px',
        border: '1px solid var(--gray-100)',
        padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        transition: 'transform 0.25s var(--ease-spring), box-shadow 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 28px rgba(15,36,64,0.1)' : '0 2px 12px rgba(15,36,64,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        alignSelf: 'flex-start',
      }}>
        <Icon size={19} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1, color: valueColor, marginBottom: '4px' }}>
          {value}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>{label}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{sub}</p>}
      </div>
    </div>
  )
}
