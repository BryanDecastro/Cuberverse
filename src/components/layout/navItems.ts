import { BookOpen, GraduationCap, House, Timer, Trophy, type LucideIcon } from 'lucide-react'
import { routes } from '@/config/routes'
import type { Dictionary } from '@/i18n/en'

export type NavItem = { to: string; label: (t: Dictionary) => string; icon: LucideIcon }

export const navItems: NavItem[] = [
  { to: routes.home, label: (t) => t.nav.home, icon: House },
  { to: routes.learn, label: (t) => t.nav.learn, icon: GraduationCap },
  { to: routes.timer, label: (t) => t.nav.timer, icon: Timer },
  { to: routes.history, label: (t) => t.nav.history, icon: BookOpen },
  { to: routes.wca, label: (t) => t.nav.wca, icon: Trophy },
]
