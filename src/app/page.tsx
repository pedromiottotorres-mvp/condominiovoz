import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/LandingPage'

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', session.user.id)
      .single()

    if (profile?.status === 'pendente') {
      redirect('/aguardando-aprovacao')
    }

    if (profile?.status === 'ativo') {
      redirect('/demandas')
    }
  }

  return <LandingPage />
}
