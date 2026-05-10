'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, BookOpen, BarChart2, Brain, Settings, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/week',     label: 'Semana',   icon: Calendar },
  { href: '/logs',     label: 'Hoy',      icon: BookOpen },
  { href: '/strength', label: 'Fuerza',   icon: Dumbbell },
  { href: '/stats',    label: 'Stats',    icon: BarChart2 },
  { href: '/review',   label: 'Revisión', icon: Brain },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors min-w-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
