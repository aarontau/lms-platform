'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  GraduationCap, LogOut, Home, Bell,
  CheckCheck, BellOff,
} from 'lucide-react'
import { notificationsApi } from '@/lib/api'

function PortalInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router     = useRouter()
  const qc         = useQueryClient()
  const notifRef   = useRef<HTMLDivElement>(null)
  const [notifOpen, setNotifOpen] = useState(false)

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated' && session?.user?.role !== 'PARENT') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Unread count — poll every 2 min
  const { data: unreadData } = useQuery({
    queryKey: ['portal-notif-count'],
    queryFn:  notificationsApi.getUnreadCount,
    refetchInterval: 2 * 60_000,
    enabled: !!session && session.user?.role === 'PARENT',
  })
  const unreadCount = unreadData?.count ?? 0

  // Notification list — loaded when panel opens
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['portal-notifications'],
    queryFn:  () => notificationsApi.getAll(),
    enabled:  notifOpen && !!session,
    staleTime: 30_000,
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-notifications'] })
      qc.invalidateQueries({ queryKey: ['portal-notif-count'] })
    },
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading your portal…</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) return null
  if (session.user?.role !== 'PARENT') return null

  const user = session.user
  const initials = (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top navigation bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Brand */}
          <Link href="/portal" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">UL-Junior Project</span>
            <span className="text-xs text-gray-400 hidden sm:block">Parent Portal</span>
          </Link>

          <div className="flex-1" />

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/portal"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </nav>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
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

                <div className="max-h-72 overflow-y-auto">
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
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleDateString('en-ZA', {
                                  day: 'numeric', month: 'short',
                                  hour: '2-digit', minute: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar + sign out */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-xs uppercase">
              {initials || '?'}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[120px]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 leading-tight">Parent</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Sign out"
              className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} UL-Junior Project — Parent Portal
      </footer>
    </div>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalInner>{children}</PortalInner>
}
