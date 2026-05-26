'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Home, Bell } from 'lucide-react'

function PortalInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    // Non-parent users belong in the main dashboard
    if (status === 'authenticated' && session?.user?.role !== 'PARENT') {
      router.push('/dashboard')
    }
  }, [status, session, router])

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
            <span className="text-sm font-bold text-gray-900 hidden sm:block">EduTrack</span>
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

          {/* Notification bell (placeholder) */}
          <button
            aria-label="Notifications"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>

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
        &copy; {new Date().getFullYear()} EduTrack LMS — Parent Portal
      </footer>
    </div>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalInner>{children}</PortalInner>
}
