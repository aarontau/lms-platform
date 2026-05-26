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
    allowedRoles: [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'PRINCIPAL',
      'HOD',
      'TEACHER',
      'PARENT',
      'LEARNER',
    ],
  },
  {
    href: '/learners',
    label: 'Learners',
    icon: GraduationCap,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
  },
  {
    href: '/subjects',
    label: 'Subjects & Classes',
    icon: BookOpen,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'HOD'],
  },
  {
    href: '/timetable',
    label: 'Timetable',
    icon: Calendar,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
  },
  {
    href: '/assessment',
    label: 'Assessment',
    icon: ClipboardList,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart2,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="flex-shrink-0 h-9 w-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">EduTrack</p>
            <p className="text-xs text-gray-500 truncate">{schoolName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Sidebar navigation">
          {visibleItems.map((item) => {
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
                  'transition-colors duration-150',
                  'group',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon
                  className={clsx(
                    'h-4.5 w-4.5 flex-shrink-0',
                    active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600',
                  )}
                  style={{ height: '1.125rem', width: '1.125rem' }}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-primary-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-1">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm uppercase">
                {session.user.firstName?.[0]}
                {session.user.lastName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{session.user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
