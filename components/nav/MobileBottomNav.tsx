'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Calendar, BookOpen, BarChart2, Brain, Settings, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

type MobileNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Texto corto visible; usar `ariaLabel` para lectores / tooltip si hace falta */
  ariaLabel?: string
}

const navItems: MobileNavItem[] = [
  { href: '/week',     label: 'Semana',   icon: Calendar },
  { href: '/logs',     label: 'Hoy',      icon: BookOpen },
  { href: '/strength', label: 'Fuerza',   icon: Dumbbell },
  { href: '/stats',    label: 'Stats',    icon: BarChart2 },
  { href: '/review',   label: 'Rev.',     icon: Brain, ariaLabel: 'Revisión' },
  { href: '/settings', label: 'Ajustes',  icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación principal" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border/50 safe-area-bottom supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-6 gap-0 px-1 py-1.5">
        {navItems.map(({ href, label, icon: Icon, ariaLabel }) => {
          const isActive = pathname.startsWith(href)
          const aria = ariaLabel ?? label
          return (
            <Link
              key={href}
              href={href}
              title={aria}
              aria-label={aria}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 rounded-lg py-2 px-0.5 transition-colors active:scale-[0.98]',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-[1.35rem] h-[1.35rem] shrink-0', isActive && 'fill-primary/20')} />
              <span className="text-[9px] font-medium leading-none text-center truncate max-w-full">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
