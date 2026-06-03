'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { clsx } from 'clsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  GraduationCap,
  CheckCheck,
  BellOff,
} from 'lucide-react'
import { RoleBadge } from '@/components/ui/Badge'
import { notificationsApi } from '@/lib/api'
import type { Role } from '@/types'

// ─── Route title map ──────────────────────────────────────────────────────────
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/learners':         'Learners',
  '/learners/register':'Register Learner',
  '/learners/bulk-import': 'Bulk Import Learners',
  '/subjects':         'Subjects & Classes',
  '/timetable':        'Timetable',
  '/assessment':       'Assessment',
  '/attendance':       'Attendance',
  '/reports':          'Report Cards',
  '/reports/promotion':  'CAPS Promotion Decisions',
  '/communications':     'School Communications',
  '/analytics':        'Analytics Dashboard',
  '/screening':        'Learner Screeners',
  '/lurits':           'LURITS / SA-SAMS Export',
  '/finance':          'Finance Management',
  '/hr':               'HR Management',
  '/users':            'User Management',
  '/users/new':        'Add User',
  '/settings':         'Settings',
  '/schools/onboarding':'School Onboarding',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Prefix match
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title
  }
  return 'UL-Junior Project'
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TopBarProps {
  onMenuClick?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [dropdownOpen,    setDropdownOpen]    = useState(false)
  const [notifPanelOpen,  setNotifPanelOpen]  = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef    = useRef<HTMLDivElement>(null)

  const pageTitle = getPageTitle(pathname)
  const user = session?.user

  // Unread count — poll every 2 minutes
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn:  notificationsApi.getUnreadCount,
    refetchInterval: 2 * 60_000,
    enabled:  !!session,
  })
  const unreadCount = unreadData?.count ?? 0

  // Notification list — loaded when panel opens
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll(),
    enabled:  notifPanelOpen && !!session,
    staleTime: 30_000,
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6">
      <div className="flex items-center h-16 gap-4">
        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Page title + breadcrumb */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate leading-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-gray-400 leading-tight hidden sm:block">UL-Junior Project</p>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifPanelOpen((v) => !v)}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* Notification panel */}
            {notifPanelOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      disabled={markAllRead.isPending}
                      className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                      <BellOff className="h-8 w-8 text-gray-300" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 ${!n.readAt ? 'bg-blue-50/40' : ''}`}>
                          <p className={`text-sm ${!n.readAt ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" aria-hidden="true" />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 shadow-sm">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>

              {/* Name + role */}
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px] leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                {user?.role && (
                  <RoleBadge role={user.role as Role} className="text-xs leading-tight" />
                )}
              </div>

              <ChevronDown
                className={clsx(
                  'h-4 w-4 text-gray-400 transition-transform duration-150 flex-shrink-0',
                  dropdownOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20"
              >
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    My Profile
                  </Link>

                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1 pb-1">
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
