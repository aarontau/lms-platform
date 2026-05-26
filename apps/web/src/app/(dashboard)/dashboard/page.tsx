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
} from 'lucide-react'
import { format } from 'date-fns'
import { usersApi, schoolsApi } from '@/lib/api'
import { RoleBadge } from '@/components/ui/Badge'
import type { User, Role } from '@/types'

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  loading = false,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {loading ? (
          <div className="mt-2 h-8 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        )}
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
      <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
      </div>
    </div>
  </div>
)

// ─── Recent Activity Item ─────────────────────────────────────────────────────
interface ActivityItem {
  id: string
  action: string
  actor: string
  time: Date
  type: 'user' | 'assessment' | 'enrollment' | 'system'
}

const PLACEHOLDER_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    action: 'New learner enrolled in Grade 10A',
    actor: 'Mrs. Sithole',
    time: new Date(Date.now() - 1000 * 60 * 15),
    type: 'enrollment',
  },
  {
    id: '2',
    action: 'Mathematics Test 1 results captured',
    actor: 'Mr. Dlamini',
    time: new Date(Date.now() - 1000 * 60 * 45),
    type: 'assessment',
  },
  {
    id: '3',
    action: 'New teacher account created',
    actor: 'Admin',
    time: new Date(Date.now() - 1000 * 60 * 120),
    type: 'user',
  },
  {
    id: '4',
    action: 'Term 2 timetable published',
    actor: 'Principal Molefe',
    time: new Date(Date.now() - 1000 * 60 * 60 * 3),
    type: 'system',
  },
  {
    id: '5',
    action: 'Physical Sciences assignment due',
    actor: 'Ms. Khumalo',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    type: 'assessment',
  },
]

const activityTypeIcon: Record<ActivityItem['type'], React.ElementType> = {
  user: Users,
  assessment: BookOpen,
  enrollment: GraduationCap,
  system: AlertCircle,
}

const activityTypeBg: Record<ActivityItem['type'], string> = {
  user: 'bg-blue-50 text-blue-600',
  assessment: 'bg-green-50 text-green-600',
  enrollment: 'bg-purple-50 text-purple-600',
  system: 'bg-yellow-50 text-yellow-600',
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
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
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-primary-200 text-sm font-medium">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {greeting()}, {user?.firstName}!
            </h1>
            <p className="mt-1 text-primary-100 text-sm">
              Here&apos;s what&apos;s happening at your school today.
            </p>
          </div>
          {user?.role && (
            <RoleBadge
              role={user.role as Role}
              className="bg-white/20 text-white border-white/30"
            />
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          School Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Learners"
            value={usersLoading ? '--' : learnerCount}
            subtitle="Enrolled this year"
            icon={GraduationCap}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
            loading={usersLoading}
          />
          <StatCard
            title="Total Teachers"
            value={usersLoading ? '--' : teacherCount}
            subtitle="Active staff members"
            icon={Users}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            loading={usersLoading}
          />
          <StatCard
            title="Active Classes"
            value={24}
            subtitle="Across all grades"
            icon={BookOpen}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Current Term"
            value="Term 2"
            subtitle="2026 Academic Year"
            icon={Calendar}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
        </div>
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="divide-y divide-gray-50" aria-label="Recent activity feed">
            {PLACEHOLDER_ACTIVITY.map((item) => {
              const Icon = activityTypeIcon[item.type]
              const iconClass = activityTypeBg[item.type]
              return (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{item.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {item.actor} &middot; {formatRelativeTime(item.time)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Quick stats panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Quick Stats</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Assessments this term', value: 48, icon: BookOpen, color: 'text-green-500' },
              { label: 'Reports generated', value: 12, icon: TrendingUp, color: 'text-blue-500' },
              { label: 'Parent accounts', value: 186, icon: Users, color: 'text-purple-500' },
              { label: 'Upcoming assessments', value: 7, icon: Calendar, color: 'text-yellow-500' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <Icon className={`h-4.5 w-4.5 ${stat.color}`} style={{ height: '1.125rem', width: '1.125rem' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{stat.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
