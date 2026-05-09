import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopNav } from '@/components/nav/DesktopNav'
import { MobileBottomNav } from '@/components/nav/MobileBottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <DesktopNav />
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-0 pb-20 lg:pb-0 overflow-x-hidden">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
