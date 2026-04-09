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
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-colors disabled:opacity-50"
      style={{ borderColor: '#ef4444', color: '#ef4444' }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      {loading ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
