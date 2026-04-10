'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 24px',
        borderRadius: 'var(--radius-md)',
        border: '2px solid #fca5a5',
        background: '#fff5f5',
        color: '#dc2626',
        fontSize: '0.9375rem',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s var(--ease-spring)',
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      {loading ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
