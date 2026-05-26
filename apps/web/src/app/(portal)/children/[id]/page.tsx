'use client'

import React, { useState } from 'react'
import { useParams, useRouter }  from 'next/navigation'
import { useQuery }   from '@tanstack/react-query'
import {
  ChevronLeft, AlertTriangle, CheckCircle2,
  BarChart2, Users, ClipboardList, FileText,
  TrendingUp, Calendar, BookOpen,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { portalApi } from '@/lib/api'

// ─── Performance level label ──────────────────────────────────────────────────
const LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  7: { label: 'Outstanding',  color: 'bg-emerald-100 text-emerald-800' },
  6: { label: 'Meritorious',  color: 'bg-green-100 text-green-700'    },
  5: { label: 'Substantial',  color: 'bg-lime-100 text-lime-700'      },
  4: { label: 'Adequate',     color: 'bg-yellow-100 text-yellow-700'  },
  3: { label: 'Moderate',     color: 'bg-amber-100 text-amber-700'    },
  2: { label: 'Elementary',   color: 'bg-orange-100 text-orange-700'  },
  1: { label: 'Not Achieved', color: 'bg-red-100 text-red-700'        },
}

function SbaBar({ pct, isAtRisk }: { pct: number; isAtRisk: boolean }) {
  const color = isAtRisk
    ? 'bg-red-500'
    : pct >= 70 ? 'bg-emerald-500'
    : pct >= 50 ? 'bg-amber-400'
    : 'bg-orange-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-12 text-right ${isAtRisk ? 'text-red-600' : 'text-gray-700'}`}>
        {pct.toFixed(1)}%
      </span>
      {isAtRisk && (
        <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" aria-label="At risk" />
      )}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'marks' | 'attendance' | 'assessments' | 'reports'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'marks',       label: 'Marks',       icon: BarChart2     },
  { key: 'attendance',  label: 'Attendance',   icon: Users         },
  { key: 'assessments', label: 'Upcoming',     icon: ClipboardList },
  { key: 'reports',     label: 'Report Cards', icon: FileText      },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChildDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [tab, setTab] = useState<Tab>('marks')

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['child-summary', id],
    queryFn:  () => portalApi.getChildSummary(id),
  })

  const { data: marks = [],       isLoading: marksLoading }  = useQuery({
    queryKey: ['child-marks', id],
    queryFn:  () => portalApi.getChildMarks(id),
    enabled:  tab === 'marks',
  })

  const { data: attendance,       isLoading: attLoading }    = useQuery({
    queryKey: ['child-attendance', id],
    queryFn:  () => portalApi.getChildAttendance(id),
    enabled:  tab === 'attendance',
  })

  const { data: assessments = [], isLoading: assLoading }    = useQuery({
    queryKey: ['child-assessments', id],
    queryFn:  () => portalApi.getChildUpcomingAssessments(id),
    enabled:  tab === 'assessments',
  })

  const { data: reports = [],     isLoading: repLoading }    = useQuery({
    queryKey: ['child-reports', id],
    queryFn:  () => portalApi.getChildReports(id),
    enabled:  tab === 'reports',
  })

  const learner    = summary?.learner
  const enrolment  = summary?.currentEnrolment
  const grade      = enrolment?.class?.grade?.gradeNumber
  const className  = enrolment?.class?.name
  const initials   = (learner?.firstName?.[0] ?? '') + (learner?.lastName?.[0] ?? '')

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Back + header ──────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => router.push('/portal')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Children
        </button>

        {sumLoading ? (
          <div className="h-36 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        ) : learner ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Gradient strip */}
            <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-400" />
            <div className="p-5 flex items-start gap-4">
              {/* Avatar */}
              {learner.photoUrl ? (
                <img
                  src={learner.photoUrl}
                  alt={learner.firstName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary-100 flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-xl uppercase flex-shrink-0">
                  {initials}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {learner.firstName} {learner.lastName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {grade ? `Grade ${grade}` : ''}{className ? ` — ${className}` : ''} &middot; {learner.studentNumber}
                </p>

                {/* Quick stats */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${summary.attendancePct !== null ? (summary.attendancePct >= 80 ? 'bg-emerald-100 text-emerald-700' : summary.attendancePct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-500'}`}>
                    <TrendingUp className="h-3 w-3" />
                    {summary.attendancePct !== null ? `${summary.attendancePct}% attendance` : 'No attendance data'}
                  </span>
                  {summary.atRiskCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      {summary.atRiskCount} at-risk subject{summary.atRiskCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.upcomingCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                      <Calendar className="h-3 w-3" />
                      {summary.upcomingCount} upcoming task{summary.upcomingCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
                tab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Marks tab ──────────────────────────────────────────────────── */}
      {tab === 'marks' && (
        <div className="space-y-4">
          {marksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (marks as any[]).length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <BarChart2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No marks captured yet for this learner.</p>
            </div>
          ) : (
            (marks as any[]).map((subject) => (
              <div key={subject.subjectId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  {subject.subjectName}
                </h3>
                <div className="space-y-2.5">
                  {subject.terms.map((t: any) => (
                    <div key={t.termId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          Term {t.termNumber} — {t.tasksCompleted}/{t.tasksTotal} tasks
                        </span>
                      </div>
                      <SbaBar pct={t.sbaPercentage} isAtRisk={t.isAtRisk} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Attendance tab ─────────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          {attLoading ? (
            <div className="h-40 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ) : attendance ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Days Present', value: attendance.present, color: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
                  { label: 'Days Absent',  value: attendance.absent,  color: 'bg-gradient-to-br from-red-600 to-red-500'     },
                  { label: 'Late Arrivals',value: attendance.late,    color: 'bg-gradient-to-br from-amber-500 to-orange-500' },
                  {
                    label: 'Attendance %',
                    value: attendance.attendancePct !== null ? `${attendance.attendancePct}%` : '—',
                    color: attendance.attendancePct === null ? 'bg-gradient-to-br from-slate-500 to-slate-400'
                         : attendance.attendancePct >= 80   ? 'bg-gradient-to-br from-primary-600 to-primary-500'
                         : 'bg-gradient-to-br from-orange-600 to-orange-500',
                  },
                ].map((s) => (
                  <div key={s.label} className={`relative overflow-hidden rounded-xl p-4 shadow-sm ${s.color}`}>
                    <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/10" />
                    <p className="text-xs font-medium text-white/80 relative">{s.label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5 relative tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent absences */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                  <h3 className="font-semibold text-gray-900 text-sm">Recent Absences &amp; Late Arrivals</h3>
                </div>
                {attendance.recentAbsences.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No absences on record.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {attendance.recentAbsences.map((a: any, i: number) => (
                      <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${a.status === 'ABSENT' ? 'bg-red-500' : a.status === 'LATE' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {a.status === 'ABSENT' ? 'Absent'
                              : a.status === 'LATE' ? 'Late'
                              : 'Excused absence'}
                            {a.grade ? ` — Grade ${a.grade} ${a.className}` : ''}
                          </p>
                          {a.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{a.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-gray-400">No attendance data available.</div>
          )}
        </div>
      )}

      {/* ── Upcoming assessments tab ────────────────────────────────────── */}
      {tab === 'assessments' && (
        <div>
          {assLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (assessments as any[]).length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No upcoming assessments right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(assessments as any[]).map((task) => {
                const dueDate  = task.dueDate ? new Date(task.dueDate) : null
                const isPast   = dueDate && dueDate < new Date()
                const isUrgent = dueDate && !isPast && (dueDate.getTime() - Date.now()) < 1000 * 60 * 60 * 48

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 ${isUrgent ? 'border-amber-300' : 'border-gray-200'}`}
                  >
                    <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${isUrgent ? 'bg-amber-100' : 'bg-primary-50'}`}>
                      <ClipboardList className={`h-4 w-4 ${isUrgent ? 'text-amber-600' : 'text-primary-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {task.programmeOfAssessment?.subjectClass?.schoolSubject?.name ?? 'Unknown subject'}
                        {task.programmeOfAssessment?.term ? ` · ${task.programmeOfAssessment.term.name}` : ''}
                      </p>
                      {task.instructions && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.instructions}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {dueDate && (
                        <p className={`text-xs font-semibold ${isUrgent ? 'text-amber-600' : 'text-gray-500'}`}>
                          {format(dueDate, 'd MMM')}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{task.maxMark} marks</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Report cards tab ────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div>
          {repLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (reports as any[]).length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No published report cards yet.</p>
              <p className="text-xs text-gray-400 mt-1">Report cards will appear here once published by the school.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(reports as any[]).map((card) => (
                <div key={card.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {card.term?.name ?? 'Annual'} Report Card
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {card.academicYear?.year} Academic Year
                      {card.publishedAt ? ` · Published ${format(new Date(card.publishedAt), 'd MMM yyyy')}` : ''}
                    </p>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Published
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
