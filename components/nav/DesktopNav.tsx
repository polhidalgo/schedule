'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, BookOpen, BarChart2, Brain, Dumbbell, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/week',     label: 'Semana',    icon: Calendar },
  { href: '/logs',     label: 'Registro',  icon: BookOpen },
  { href: '/stats',    label: 'Stats',     icon: BarChart2 },
  { href: '/review',   label: 'Revisión',  icon: Brain },
  { href: '/settings', label: 'Ajustes',   icon: Settings },
]

export function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-card border-r border-border/50 p-4">
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">Training</p>
          <p className="text-xs text-muted-foreground leading-none mt-1">Schedule</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        Salir
      </button>
    </aside>
  )
}
