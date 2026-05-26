'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { usersApi } from '@/lib/api'
import { RoleBadge } from '@/components/ui/Badge'
import type { User, Role } from '@/types'

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, trend, icon: Icon,
  gradient, iconBg, loading = false,
}) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 shadow-md ${gradient}`}>
    {/* Decorative circle */}
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
    <div className="absolute -right-1 -top-1 h-12 w-12 rounded-full bg-white/10" />

    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        {loading ? (
          <div className="mt-2 h-9 w-20 bg-white/20 rounded-lg animate-pulse" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
        )}
        {subtitle && (
          <p className="mt-1 text-xs text-white/60">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-white/80">
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            {trend}
          </div>
        )}
      </div>
      <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
    </div>
  </div>
)

// ─── Activity feed ────────────────────────────────────────────────────────────
interface ActivityItem {
  id: string
  action: string
  actor: string
  time: Date
  type: 'user' | 'assessment' | 'enrollment' | 'system'
}

const PLACEHOLDER_ACTIVITY: ActivityItem[] = [
  { id: '1', action: 'New learner enrolled in Grade 10A',         actor: 'Mrs. Sithole',     time: new Date(Date.now() - 1000*60*15),      type: 'enrollment' },
  { id: '2', action: 'Mathematics Test 1 results captured',       actor: 'Mr. Dlamini',      time: new Date(Date.now() - 1000*60*45),      type: 'assessment' },
  { id: '3', action: 'New teacher account created',               actor: 'Admin',            time: new Date(Date.now() - 1000*60*120),     type: 'user'       },
  { id: '4', action: 'Term 2 timetable published',                actor: 'Principal Molefe', time: new Date(Date.now() - 1000*60*60*3),   type: 'system'     },
  { id: '5', action: 'Physical Sciences assignment due tomorrow',  actor: 'Ms. Khumalo',     time: new Date(Date.now() - 1000*60*60*5),   type: 'assessment' },
]

const ACTIVITY_META: Record<ActivityItem['type'], { icon: React.ElementType; bg: string; dot: string }> = {
  user:       { icon: Users,          bg: 'bg-blue-100',   dot: 'bg-blue-500'   },
  assessment: { icon: BookOpen,       bg: 'bg-green-100',  dot: 'bg-green-500'  },
  enrollment: { icon: GraduationCap,  bg: 'bg-violet-100', dot: 'bg-violet-500' },
  system:     { icon: AlertCircle,    bg: 'bg-amber-100',  dot: 'bg-amber-500'  },
}

const ACTIVITY_ICON_COLOR: Record<ActivityItem['type'], string> = {
  user:       'text-blue-600',
  assessment: 'text-green-600',
  enrollment: 'text-violet-600',
  system:     'text-amber-600',
}

function formatRelativeTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return format(date, 'dd MMM')
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: !!session,
  })

  const learnerCount = users?.filter((u: User) => u.role === 'LEARNER').length ?? 0
  const teacherCount = users?.filter((u: User) => u.role === 'TEACHER').length ?? 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 p-6 shadow-lg">
        {/* Background decoration */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <Activity className="absolute right-6 bottom-6 h-24 w-24 text-white/10" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-primary-200 text-sm font-medium">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {greeting()}, {user?.firstName}! 👋
            </h1>
            <p className="mt-1 text-primary-100 text-sm">
              Here&apos;s what&apos;s happening at your school today.
            </p>
          </div>
          {user?.role && (
            <RoleBadge
              role={user.role as Role}
              className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
            />
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          School Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Learners"
            value={usersLoading ? '--' : learnerCount}
            subtitle="Enrolled this year"
            trend="+12 this month"
            icon={GraduationCap}
            gradient="bg-gradient-to-br from-violet-600 to-violet-500"
            iconBg="bg-white/20"
            loading={usersLoading}
          />
          <StatCard
            title="Total Teachers"
            value={usersLoading ? '--' : teacherCount}
            subtitle="Active staff members"
            trend="+2 this term"
            icon={Users}
            gradient="bg-gradient-to-br from-emerald-600 to-emerald-500"
            iconBg="bg-white/20"
            loading={usersLoading}
          />
          <StatCard
            title="Active Classes"
            value={24}
            subtitle="Across all grades"
            icon={BookOpen}
            gradient="bg-gradient-to-br from-blue-600 to-blue-500"
            iconBg="bg-white/20"
          />
          <StatCard
            title="Current Term"
            value="Term 2"
            subtitle="2026 Academic Year"
            icon={Calendar}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            iconBg="bg-white/20"
          />
        </div>
      </div>

      {/* ── Lower section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-500" aria-hidden="true" />
              <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 transition-colors">
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <ul className="divide-y divide-gray-50" aria-label="Recent activity feed">
            {PLACEHOLDER_ACTIVITY.map((item) => {
              const meta = ACTIVITY_META[item.type]
              const Icon = meta.icon
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${meta.bg}`}
                    aria-hidden="true"
                  >
                    <Icon className={`h-4 w-4 ${ACTIVITY_ICON_COLOR[item.type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium">{item.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {item.actor} &middot; {formatRelativeTime(item.time)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <TrendingUp className="h-4 w-4 text-primary-500" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900 text-sm">Quick Stats</h2>
          </div>

          <div className="p-5 space-y-3">
            {[
              { label: 'Assessments this term', value: 48,  icon: BookOpen,       color: 'bg-green-500',  light: 'bg-green-50',  pct: 80 },
              { label: 'Reports generated',      value: 12,  icon: TrendingUp,     color: 'bg-blue-500',   light: 'bg-blue-50',   pct: 25 },
              { label: 'Parent accounts',        value: 186, icon: Users,          color: 'bg-violet-500', light: 'bg-violet-50', pct: 65 },
              { label: 'Upcoming assessments',   value: 7,   icon: Calendar,       color: 'bg-amber-500',  light: 'bg-amber-50',  pct: 14 },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${stat.light} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${stat.color.replace('bg-', '')}`} aria-hidden="true" />
                    </div>
                    <p className="flex-1 text-xs text-gray-600 font-medium truncate">{stat.label}</p>
                    <span className="font-bold text-gray-900 text-sm tabular-nums">{stat.value}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-10">
                    <div
                      className={`h-full rounded-full ${stat.color} transition-all duration-700`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Term progress */}
          <div className="px-5 pb-5">
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary-700">Term 2 Progress</p>
                <span className="text-xs font-bold text-primary-600">62%</span>
              </div>
              <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700"
                  style={{ width: '62%' }}
                />
              </div>
              <p className="mt-2 text-xs text-primary-500">Ends 20 June 2026 &middot; 5 weeks remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
