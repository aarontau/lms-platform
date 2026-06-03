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
  BrainCircuit,
  Eye,
  Award,
  FileText,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { usersApi, screeningApi, learnersApi, dashboardApi } from '@/lib/api'
import { RoleBadge } from '@/components/ui/Badge'
import type { User, Role } from '@/types'
import Link from 'next/link'

// ─── Risk badge ───────────────────────────────────────────────────────────────
const RISK_BADGE: Record<string, string> = {
  HIGH:     'bg-red-100 text-red-700 border border-red-200',
  MODERATE: 'bg-amber-100 text-amber-700 border border-amber-200',
  LOW:      'bg-green-100 text-green-700 border border-green-200',
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${RISK_BADGE[level] ?? 'bg-gray-100 text-gray-500'}`}>
      {level}
    </span>
  )
}

const SCREENER_LABEL: Record<string, string> = {
  DYSLEXIA:         'Dyslexia',
  ADHD_INATTENTIVE: 'ADHD (Inattentive)',
  ADHD_HYPERACTIVE: 'ADHD (Hyperactive)',
  ADHD_COMBINED:    'ADHD (Combined)',
}

// ─── Principal screening panel ────────────────────────────────────────────────
function PrincipalScreeningPanel() {
  const { data: summary } = useQuery({
    queryKey: ['screening-summary'],
    queryFn:  () => screeningApi.getPrincipalSummary(),
    staleTime: 60_000,
  })
  const { data: pending = [] } = useQuery({
    queryKey: ['screening-pending'],
    queryFn:  () => screeningApi.list({ reviewedByPrincipal: false, riskLevel: 'HIGH' }),
    staleTime: 30_000,
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-rose-50/60">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-rose-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Screener Summary</h2>
          {summary?.pendingReview > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
              {summary.pendingReview} pending
            </span>
          )}
        </div>
        <Link href="/screening"
          className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
          {[
            { label: 'Total Screened', value: summary.total,       bg: 'bg-gray-50' },
            { label: 'High Risk',      value: summary.highRisk,    bg: 'bg-red-50' },
            { label: 'Awaiting Review',value: summary.pendingReview, bg: 'bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className={`px-4 py-3 text-center ${s.bg}`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* High-risk pending list */}
      {pending.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs text-gray-400">
          No high-risk screenings pending review
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {pending.slice(0, 5).map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {s.learner?.firstName?.[0]}{s.learner?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.learner?.firstName} {s.learner?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {SCREENER_LABEL[s.screenerType] ?? s.screenerType}
                  {' · '}Score: {s.totalScore}
                </p>
              </div>
              <RiskBadge level={s.riskLevel} />
              <Link href={`/screening/${s.id}`}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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

  // Real dashboard stats from DB
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    enabled: !!session,
    staleTime: 60_000,
  })

  // Learner count comes from the Learner table (not User table)
  const { data: learnerData } = useQuery({
    queryKey: ['learners-count'],
    queryFn: () => learnersApi.getAll({ limit: 1, page: 1 }),
    enabled: !!session,
    staleTime: 60_000,
  })

  const learnerCount = stats?.learnerCount ?? learnerData?.meta?.total ?? 0
  const teacherCount = stats?.teacherCount ?? users?.filter((u: User) => u.role === 'TEACHER').length ?? 0
  const classCount   = stats?.classCount   ?? 0
  const activeTerm   = stats?.activeTerm

  // Compute live term progress from start/end dates
  const termProgress = React.useMemo(() => {
    if (!activeTerm) return null
    const now   = Date.now()
    const start = new Date(activeTerm.startDate).getTime()
    const end   = new Date(activeTerm.endDate).getTime()
    if (now <= start) return { pct: 0, weeksLeft: Math.ceil((end - now) / (7 * 864e5)), endsLabel: format(new Date(activeTerm.endDate), 'd MMMM yyyy') }
    if (now >= end)   return { pct: 100, weeksLeft: 0, endsLabel: format(new Date(activeTerm.endDate), 'd MMMM yyyy') }
    const pct      = Math.round(((now - start) / (end - start)) * 100)
    const weeksLeft = Math.ceil((end - now) / (7 * 864e5))
    return { pct, weeksLeft, endsLabel: format(new Date(activeTerm.endDate), 'd MMMM yyyy') }
  }, [activeTerm])

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
        <span className="absolute right-4 bottom-1 text-[8rem] font-black text-white/10 leading-none select-none" aria-hidden="true">Σ</span>

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
            value={learnerCount}
            subtitle="Enrolled this year"
            icon={GraduationCap}
            gradient="bg-gradient-to-br from-violet-600 to-violet-500"
            iconBg="bg-white/20"
            loading={!learnerData && usersLoading}
          />
          <StatCard
            title="Total Teachers"
            value={usersLoading ? '--' : teacherCount}
            subtitle="Active staff members"
            icon={Users}
            gradient="bg-gradient-to-br from-emerald-600 to-emerald-500"
            iconBg="bg-white/20"
            loading={usersLoading}
          />
          <StatCard
            title="Active Classes"
            value={classCount}
            subtitle="Across all grades"
            icon={BookOpen}
            gradient="bg-gradient-to-br from-blue-600 to-blue-500"
            iconBg="bg-white/20"
            loading={!stats && usersLoading}
          />
          <StatCard
            title="Current Term"
            value={activeTerm ? activeTerm.name : 'No Active Term'}
            subtitle={activeTerm ? `${new Date(activeTerm.startDate).getFullYear()} Academic Year` : 'Not configured'}
            icon={Calendar}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            iconBg="bg-white/20"
            loading={!stats && usersLoading}
          />
        </div>
      </div>

      {/* ── Principal section ───────────────────────────────────────────── */}
      {(user?.role === 'PRINCIPAL' || user?.role === 'SCHOOL_ADMIN') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrincipalScreeningPanel />

          {/* Promotion Decisions widget */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-violet-50/60">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-500" />
                <h2 className="font-semibold text-gray-900 text-sm">CAPS Promotion Decisions</h2>
              </div>
              <Link href="/reports/promotion"
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {stats?.promotion ? (
              <>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {[
                    { label: 'Promote',   value: stats.promotion.promote,  color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <TrendingUp className="h-4 w-4" /> },
                    { label: 'Progress',  value: stats.promotion.progress, color: 'text-amber-700',   bg: 'bg-amber-50',   icon: <AlertCircle className="h-4 w-4" /> },
                    { label: 'Repeat',    value: stats.promotion.repeat,   color: 'text-red-700',     bg: 'bg-red-50',     icon: <XCircle className="h-4 w-4" /> },
                  ].map((s) => (
                    <div key={s.label} className={`px-4 py-5 text-center ${s.bg}`}>
                      <div className={`flex justify-center mb-1.5 ${s.color}`}>{s.icon}</div>
                      <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-2xs text-gray-400 uppercase font-semibold tracking-wide">
                      Promotion rate
                    </span>
                    <span className="ml-auto text-xs font-bold text-emerald-700">
                      {stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat > 0
                        ? Math.round((stats.promotion.promote / (stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-700"
                      style={{ width: `${stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat > 0 ? Math.round((stats.promotion.promote / (stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat)) * 100) : 0}%` }} />
                    <div className="bg-amber-400 h-full transition-all duration-700"
                      style={{ width: `${stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat > 0 ? Math.round((stats.promotion.progress / (stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat)) * 100) : 0}%` }} />
                    <div className="bg-red-400 h-full transition-all duration-700"
                      style={{ width: `${stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat > 0 ? Math.round((stats.promotion.repeat / (stats.promotion.promote + stats.promotion.progress + stats.promotion.repeat)) * 100) : 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Auto-calculated from annual CAPS results
                    {activeTerm ? ` · ${new Date(activeTerm.startDate).getFullYear()}` : ''}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-10 text-center">
                <div className="h-8 w-8 mx-auto bg-gray-100 rounded-full animate-pulse mb-2" />
                <p className="text-xs text-gray-400">Loading…</p>
              </div>
            )}
          </div>
        </div>
      )}

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
              { label: 'Report cards (total)',   value: (stats?.reports?.published ?? 0) + (stats?.reports?.draft ?? 0), icon: FileText,  color: 'bg-blue-500',   light: 'bg-blue-50',   pct: 100 },
              { label: 'Published reports',      value: stats?.reports?.published ?? 0,      icon: TrendingUp,     color: 'bg-emerald-500', light: 'bg-emerald-50', pct: stats && (stats.reports.published + stats.reports.draft) > 0 ? Math.round((stats.reports.published / (stats.reports.published + stats.reports.draft)) * 100) : 0 },
              { label: 'Parent portal accounts', value: stats?.parentCount ?? 0,             icon: Users,          color: 'bg-violet-500', light: 'bg-violet-50', pct: Math.min(100, Math.round(((stats?.parentCount ?? 0) / Math.max(1, learnerCount)) * 100)) },
              { label: 'Active classes',         value: stats?.classCount ?? classCount,     icon: BookOpen,       color: 'bg-amber-500',  light: 'bg-amber-50',  pct: 100 },
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
          {termProgress && activeTerm && (
            <div className="px-5 pb-5">
              <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-primary-700">{activeTerm.name} Progress</p>
                  <span className="text-xs font-bold text-primary-600">{termProgress.pct}%</span>
                </div>
                <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700"
                    style={{ width: `${termProgress.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-primary-500">
                  Ends {termProgress.endsLabel}
                  {termProgress.weeksLeft > 0
                    ? ` · ${termProgress.weeksLeft} week${termProgress.weeksLeft !== 1 ? 's' : ''} remaining`
                    : ' · Completed'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
