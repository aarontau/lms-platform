'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import type { Role } from '@/types'

// ─── Nav item definitions ─────────────────────────────────────────────────────
interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  allowedRoles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD','TEACHER','PARENT','LEARNER'],
  },
  {
    href: '/learners',
    label: 'Learners',
    icon: GraduationCap,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD','TEACHER'],
  },
  {
    href: '/subjects',
    label: 'Subjects & Classes',
    icon: BookOpen,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD'],
  },
  {
    href: '/timetable',
    label: 'Timetable',
    icon: Calendar,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD','TEACHER'],
  },
  {
    href: '/assessment',
    label: 'Assessment',
    icon: ClipboardList,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD','TEACHER'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart2,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','HOD','TEACHER'],
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN','SCHOOL_ADMIN'],
  },
]

// ─── Section grouping ─────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'Main',
    items: ['/dashboard'],
  },
  {
    title: 'Academic',
    items: ['/learners', '/subjects', '/timetable', '/assessment'],
  },
  {
    title: 'Management',
    items: ['/reports', '/users', '/settings'],
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { data: session } = useSession()
  const pathname = usePathname()

  const userRole = session?.user?.role as Role | undefined
  const schoolName = session?.user?.schoolId ? 'EduTrack School' : 'EduTrack LMS'

  const visibleItems = NAV_ITEMS.filter(
    (item) => !userRole || item.allowedRoles.includes(userRole),
  )

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const getSection = (href: string) =>
    NAV_SECTIONS.find((s) => s.items.includes(href))?.title

  // Build sections preserving order
  const sections: { title: string; items: NavItem[] }[] = []
  NAV_SECTIONS.forEach((section) => {
    const sectionItems = visibleItems.filter((i) => section.items.includes(i.href))
    if (sectionItems.length > 0) {
      sections.push({ title: section.title, items: sectionItems })
    }
  })

  const initials =
    (session?.user?.firstName?.[0] ?? '') + (session?.user?.lastName?.[0] ?? '')

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel — dark navy */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-full w-64',
          'flex flex-col',
          'bg-primary-950',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Logo / brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex-shrink-0 h-9 w-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-primary">
            <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">EduTrack</p>
            <p className="text-xs text-primary-400 truncate">{schoolName}</p>
          </div>
        </div>

        {/* Nav sections */}
        <nav
          className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-hide"
          aria-label="Sidebar navigation"
        >
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-2xs font-semibold uppercase tracking-widest text-primary-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                        'transition-all duration-150 group',
                        active
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-primary-200 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      <Icon
                        className={clsx(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          active
                            ? 'text-white'
                            : 'text-primary-400 group-hover:text-primary-200',
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <ChevronRight
                          className="h-3.5 w-3.5 text-primary-300"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 px-3 py-3 space-y-1">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm uppercase">
                {initials || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-xs text-primary-400 truncate">{session.user.role}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-300 hover:bg-red-500/15 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
