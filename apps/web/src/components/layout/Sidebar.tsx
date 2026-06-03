'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { schoolsApi } from '@/lib/api'
import { SchoolSeal } from '@/components/ui/SchoolSeal'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  ClipboardCheck,
  BarChart2,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
  BrainCircuit,
  Briefcase,
  ShieldCheck,
  PieChart,
  MessageSquare,
  Lock,
  Printer,
  Stethoscope,
} from 'lucide-react'

// ─── Custom Rand (ZAR) icon — bold R ─────────────────────────────────────────
function RandIcon({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center justify-center font-black leading-none select-none ${className ?? ''}`}
      {...props}
    >
      R
    </span>
  )
}

// ─── Role display labels ──────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  PRINCIPAL:    'Project Leader',
  HOD:          'Head of Department',
  TEACHER:      'Teacher',
  PARENT:       'Parent',
  LEARNER:      'Learner',
}

// ─── Base nav sections (all staff) ───────────────────────────────────────────
const MAIN_SECTION = {
  title: 'Main',
  items: [
    { href: '/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  ],
}

const ACADEMIC_SECTION = {
  title: 'Academic',
  items: [
    { href: '/learners',    label: 'Learners',           icon: GraduationCap  },
    { href: '/subjects',    label: 'Subjects & Classes', icon: BookOpen       },
    { href: '/timetable',   label: 'Timetable',          icon: Calendar       },
    { href: '/attendance',             label: 'Attendance',          icon: ClipboardCheck },
    { href: '/assessment',             label: 'Assessment',          icon: ClipboardList  },
    { href: '/assessment/diagnostic',  label: 'Diagnostic Assessment', icon: Stethoscope  },
    { href: '/classlists',             label: 'Class Lists',         icon: Printer        },
  ],
}

// Management nav — principalOnly items hidden from teachers/HODs
// locked items show a padlock badge and are password-gated on the page itself
type NavItem = { href: string; label: string; icon: React.ElementType; principalOnly?: boolean; locked?: boolean }

const MANAGEMENT_NAV: NavItem[] = [
  { href: '/analytics',      label: 'Analytics',      icon: PieChart                                         },
  { href: '/reports',        label: 'Report Cards',   icon: BarChart2                                        },
  { href: '/screening',      label: 'Screeners',      icon: BrainCircuit, principalOnly: true, locked: true  },
  { href: '/communications', label: 'Communications', icon: MessageSquare                                    },
  { href: '/lurits',         label: 'LURITS Export',  icon: ShieldCheck,  principalOnly: true               },
  { href: '/finance',        label: 'Finance',        icon: RandIcon,     principalOnly: true               },
  { href: '/hr',             label: 'HR',             icon: Briefcase,    principalOnly: true               },
  { href: '/users',          label: 'Users',          icon: Users                                            },
  { href: '/settings',       label: 'Settings',       icon: Settings                                         },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { data: session } = useSession()
  const pathname = usePathname()

  const userRole = session?.user?.role

  // Fetch live school name (cached 10 min; non-blocking)
  const { data: school } = useQuery({
    queryKey: ['my-school'],
    queryFn:  () => schoolsApi.getMy(),
    staleTime: 10 * 60_000,
    enabled:  !!session && userRole !== 'SUPER_ADMIN' && userRole !== 'PARENT',
  })
  const schoolName = school?.name ?? ''

  // Screeners + several admin tabs are Principal / Super Admin only
  const isPrincipalOrAdmin = userRole === 'PRINCIPAL' || userRole === 'SUPER_ADMIN'
  const managementItems = MANAGEMENT_NAV.filter(item => isPrincipalOrAdmin || !item.principalOnly)

  const sections = [
    MAIN_SECTION,
    ACADEMIC_SECTION,
    { title: 'Management', items: managementItems },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const initials =
    (session?.user?.firstName?.[0] ?? '') +
    (session?.user?.lastName?.[0] ?? '')

  const displayName =
    `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim()

  const roleLabel = userRole ? (ROLE_LABELS[userRole] ?? userRole.replace('_', ' ')) : ''

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

      {/* Sidebar panel */}
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
        {/* Logo / brand — circular seal with arc text */}
        <div className="flex items-center justify-center px-2 pt-3 pb-2 border-b border-white/10">
          <SchoolSeal
            size={192}
            topLabel="UL-Junior Project"
            bottomLabel={schoolName || 'MWED-BUPHEPHUKGAMA'}
            variant="light"
          />
        </div>

        {/* Nav sections */}
        <nav
          className="flex-1 px-3 py-4 overflow-y-auto space-y-4 sidebar-nav"
          aria-label="Sidebar navigation"
        >
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1 text-2xs font-semibold uppercase tracking-widest text-primary-500">
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
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
                      {'locked' in item && item.locked && !active && (
                        <Lock className="h-3 w-3 text-primary-400/70 flex-shrink-0" aria-label="Password protected" />
                      )}
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
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-primary-400 truncate">{roleLabel}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
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
