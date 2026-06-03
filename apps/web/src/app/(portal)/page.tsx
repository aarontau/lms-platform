'use client'

import React from 'react'
import { useSession }    from 'next-auth/react'
import { useQuery }      from '@tanstack/react-query'
import { useRouter }     from 'next/navigation'
import {
  GraduationCap, TrendingUp, AlertTriangle,
  ClipboardList, ChevronRight, BookOpen,
} from 'lucide-react'
import { portalApi } from '@/lib/api'
import { format }    from 'date-fns'

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({
  label, value, icon: Icon, color,
}: {
  label: string
  value: string | number | null
  icon:  React.ElementType
  color: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color}`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium opacity-75 leading-tight">{label}</p>
        <p className="text-sm font-bold leading-tight">
          {value !== null && value !== undefined ? value : '—'}
        </p>
      </div>
    </div>
  )
}

// ─── Child card ───────────────────────────────────────────────────────────────
function ChildCard({ child }: { child: any }) {
  const router = useRouter()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['child-summary', child.learnerId],
    queryFn:  () => portalApi.getChildSummary(child.learnerId),
    staleTime: 60_000,
  })

  const grade    = child.currentEnrolment?.class?.grade?.gradeNumber
  const className = child.currentEnrolment?.class?.name
  const year     = child.currentEnrolment?.academicYear?.year

  const initials = (child.firstName?.[0] ?? '') + (child.lastName?.[0] ?? '')

  return (
    <button
      onClick={() => router.push(`/portal/children/${child.learnerId}`)}
      className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden text-left group"
    >
      {/* Coloured top strip */}
      <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-400" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {child.photoUrl ? (
            <img
              src={child.photoUrl}
              alt={`${child.firstName} ${child.lastName}`}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0 border-2 border-primary-100"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base leading-tight">
              {child.firstName} {child.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {grade ? `Grade ${grade}` : ''}{className ? ` — ${className}` : ''}
            </p>
            <p className="text-xs text-gray-400">{child.studentNumber}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 flex-1 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-3 gap-2">
            <StatChip
              label="Attendance"
              value={summary.attendancePct !== null ? `${summary.attendancePct}%` : null}
              icon={TrendingUp}
              color={
                summary.attendancePct === null ? 'bg-gray-50 text-gray-500'
                : summary.attendancePct >= 80  ? 'bg-emerald-50 text-emerald-700'
                : summary.attendancePct >= 60  ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
              }
            />
            <StatChip
              label="At-risk subjects"
              value={summary.atRiskCount}
              icon={AlertTriangle}
              color={summary.atRiskCount > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
            />
            <StatChip
              label="Upcoming tasks"
              value={summary.upcomingCount}
              icon={ClipboardList}
              color="bg-blue-50 text-blue-700"
            />
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">No summary available</p>
        )}

        {/* Year badge */}
        {year && (
          <p className="mt-3 text-right text-xs text-gray-400">{year} Academic Year</p>
        )}
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortalHomePage() {
  const { data: session } = useSession()
  const user = session?.user

  const { data: children = [], isLoading, isError } = useQuery({
    queryKey: ['my-children'],
    queryFn:  () => portalApi.getMyChildren(),
    enabled:  !!session,
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 p-6 shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <GraduationCap className="absolute right-6 bottom-6 h-24 w-24 text-white/10" aria-hidden="true" />

        <div className="relative">
          <p className="text-primary-200 text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {greeting()}, {user?.firstName}! 👋
          </h1>
          <p className="mt-1 text-primary-100 text-sm max-w-md">
            Here&apos;s an overview of your {children.length === 1 ? 'child' : 'children'} at school today.
          </p>
        </div>
      </div>

      {/* ── My children ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          My Children
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Failed to load children. Please refresh.
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
            <GraduationCap className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-500">No learners linked to your account</p>
            <p className="text-xs text-gray-400 mt-1">
              Please contact the school administrator to link your children.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children.map((child) => (
              <ChildCard key={child.learnerId} child={child} />
            ))}
          </div>
        )}
      </div>

      {/* ── Help block ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">How to read the cards</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Tap any child card to see their full marks, attendance history, upcoming assessments,
            and published report cards. An <span className="text-red-600 font-semibold">at-risk</span> flag
            means their SBA is below 40% in one or more subjects.
          </p>
        </div>
      </div>
    </div>
  )
}
