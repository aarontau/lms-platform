'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, Users, GraduationCap,
  BarChart2, AlertTriangle, CheckCircle2, RefreshCw,
  BookOpen, Activity,
} from 'lucide-react'
import { analyticsApi, academicYearsApi } from '@/lib/api'
import type { AcademicYear, EnrolmentByGrade, SubjectPerformance, AtRiskLearner } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(val: number, max = 100) {
  return Math.min(Math.max(val, 0), max)
}

function ProgressBar({ value, color = 'bg-primary-500' }: { value: number; color?: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct(value)}%` }}
      />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, gradient }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; gradient: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-md ${gradient}`}>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="mt-1 text-3xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-white/60">{sub}</p>}
      </div>
      <div className="absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [tab, setTab] = useState<'overview' | 'attendance' | 'subjects' | 'atrisk'>('overview')

  // Resolve current academic year ID dynamically
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 5 * 60_000,
  })
  const currentAY = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const AY_ID     = currentAY?.id ?? ''

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['analytics-overview', AY_ID],
    queryFn:  () => analyticsApi.getOverview(AY_ID || undefined),
    staleTime: 60_000,
    enabled:  !!AY_ID,
  })

  const { data: enrolment = [], isLoading: enrLoading } = useQuery<EnrolmentByGrade[]>({
    queryKey: ['analytics-enrolment', AY_ID],
    queryFn:  () => analyticsApi.getEnrolment(AY_ID),
    staleTime: 60_000,
    enabled:  tab === 'overview' && !!AY_ID,
  })

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['analytics-attendance'],
    queryFn:  () => analyticsApi.getAttendance(),
    staleTime: 60_000,
    enabled: tab === 'attendance',
  })

  const { data: subjects = [], isLoading: subLoading } = useQuery<SubjectPerformance[]>({
    queryKey: ['analytics-subjects'],
    queryFn:  () => analyticsApi.getSubjects(),
    staleTime: 60_000,
    enabled: tab === 'subjects',
  })

  const { data: atRisk = [], isLoading: riskLoading } = useQuery<AtRiskLearner[]>({
    queryKey: ['analytics-at-risk'],
    queryFn:  () => analyticsApi.getAtRisk(undefined, 30),
    staleTime: 60_000,
    enabled: tab === 'atrisk',
  })

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <span className="absolute right-4 bottom-1 text-[8rem] font-black text-white/10 leading-none select-none" aria-hidden="true">σ</span>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-indigo-100 mt-0.5">
            School performance, attendance trends, and at-risk identification
          </p>
        </div>
      </div>

      {/* ── Quick stat cards ─────────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Learners"
            value={overview.learners.total.toLocaleString()}
            sub={`${overview.learners.male} male · ${overview.learners.female} female`}
            icon={GraduationCap}
            gradient="bg-gradient-to-br from-violet-600 to-violet-500"
          />
          <StatCard
            label="Teachers"
            value={overview.staff.teachers}
            sub={`${overview.staff.classes} active classes`}
            icon={Users}
            gradient="bg-gradient-to-br from-blue-600 to-blue-500"
          />
          <StatCard
            label="Academic At-Risk"
            value={overview.atRisk.academic}
            sub="SBA below 40% in ≥1 subject"
            icon={AlertTriangle}
            gradient={overview.atRisk.academic > 0
              ? 'bg-gradient-to-br from-red-600 to-red-500'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-500'}
          />
          <StatCard
            label="Screener High Risk"
            value={overview.atRisk.screener.high}
            sub={`${overview.atRisk.screener.moderate} moderate risk`}
            icon={Activity}
            gradient={overview.atRisk.screener.high > 0
              ? 'bg-gradient-to-br from-rose-600 to-rose-500'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-500'}
          />
        </div>
      )}
      {ovLoading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
          {([
            { key: 'overview',   label: 'Enrolment by Grade' },
            { key: 'attendance', label: 'Attendance' },
            { key: 'subjects',   label: 'Subject Performance' },
            { key: 'atrisk',     label: 'At-Risk Learners' },
          ] as { key: typeof tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Enrolment by grade */}
        {tab === 'overview' && (
          <div className="p-5">
            {enrLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : enrolment.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">No enrolment data available.</p>
            ) : (
              <div className="space-y-3">
                {enrolment.map((g) => (
                  <div key={g.gradeNumber} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 w-20">{g.name}</span>
                        <span className="text-xs text-gray-400">{g.male}M · {g.female}F</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{g.total}</span>
                    </div>
                    <div className="flex gap-1">
                      {/* Male bar */}
                      <div
                        className="h-3 bg-blue-400 rounded-l-full transition-all duration-700"
                        style={{ width: `${(g.male / g.total) * 100}%` }}
                        title={`Male: ${g.male}`}
                      />
                      {/* Female bar */}
                      <div
                        className="h-3 bg-rose-400 rounded-r-full transition-all duration-700"
                        style={{ width: `${(g.female / g.total) * 100}%` }}
                        title={`Female: ${g.female}`}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-4 bg-blue-400 rounded-full inline-block" /> Male</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-4 bg-rose-400 rounded-full inline-block" /> Female</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance */}
        {tab === 'attendance' && (
          <div className="p-5 space-y-5">
            {attLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : !attendance ? (
              <p className="text-center py-8 text-sm text-gray-400">No attendance data captured yet.</p>
            ) : (
              <>
                {/* Overall stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Attendance Rate', value: `${attendance.overall.attendanceRate}%`,
                      color: attendance.overall.attendanceRate >= 80 ? 'text-emerald-600' : 'text-red-600' },
                    { label: 'Present',  value: attendance.overall.present.toLocaleString(),  color: 'text-emerald-700' },
                    { label: 'Absent',   value: attendance.overall.absent.toLocaleString(),   color: 'text-red-600' },
                    { label: 'Late',     value: attendance.overall.late.toLocaleString(),     color: 'text-amber-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Overall bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Overall Attendance Rate</span>
                    <span className="font-semibold">{attendance.overall.attendanceRate}%</span>
                  </div>
                  <ProgressBar
                    value={attendance.overall.attendanceRate}
                    color={attendance.overall.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-red-500'}
                  />
                </div>

                {/* 7-day rolling chart */}
                {attendance.rolling7Days && attendance.rolling7Days.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Last 7 Days</h3>
                    <div className="flex items-end gap-2 h-28">
                      {attendance.rolling7Days.map((d: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            className={`w-full rounded-t-md transition-all duration-700 ${d.rate >= 80 ? 'bg-emerald-400' : d.rate >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ height: `${pct(d.rate)}%` }}
                          />
                          <p className="text-xs text-gray-400 tabular-nums">
                            {new Date(d.date).toLocaleDateString('en-ZA', { weekday: 'short' })}
                          </p>
                          {/* Tooltip */}
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {d.date}: {d.rate}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {attendance.rolling7Days?.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No attendance captured in the last 7 days.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Subject performance */}
        {tab === 'subjects' && (
          <div className="p-5">
            {subLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">No SBA data captured yet. Mark books must be completed first.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sorted by lowest performance first — subjects needing attention shown at top.
                </p>
                {subjects.map((s) => (
                  <div key={s.code} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-2">Gr {s.grades.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-xs text-gray-400">Avg SBA</p>
                          <p className={`text-sm font-bold ${s.averageSba >= 50 ? 'text-gray-900' : 'text-red-600'}`}>
                            {s.averageSba}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Pass rate</p>
                          <p className={`text-sm font-bold ${s.passRate >= 70 ? 'text-emerald-700' : s.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {s.passRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Learners</p>
                          <p className="text-sm font-semibold text-gray-700">{s.totalLearners}</p>
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      value={s.passRate}
                      color={s.passRate >= 70 ? 'bg-emerald-500' : s.passRate >= 50 ? 'bg-amber-400' : 'bg-red-500'}
                    />
                    {s.atRisk > 0 && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {s.atRisk} learner{s.atRisk !== 1 ? 's' : ''} at risk in this subject
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* At-risk learners */}
        {tab === 'atrisk' && (
          <div>
            {riskLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : atRisk.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-emerald-600 font-semibold">No learners currently at academic risk</p>
                <p className="text-xs text-gray-400 mt-1">All SBA results are above the 40% threshold</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Learner', 'Student #', 'Grade', 'Subjects at Risk', 'Subjects'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {atRisk.map((r) => (
                      <tr key={r.learnerId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.studentNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Grade {r.grade}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            r.atRiskCount >= 3 ? 'bg-red-100 text-red-700' : r.atRiskCount === 2 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            {r.atRiskCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                          {r.subjects.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
