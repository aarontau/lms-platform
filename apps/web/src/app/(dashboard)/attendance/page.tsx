'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Users, ChevronLeft, ChevronRight, Calendar,
  Plus, RefreshCw, X, TrendingUp, BarChart2,
} from 'lucide-react'
import { attendanceApi, gradesApi, academicYearsApi } from '@/lib/api'
import type { AcademicYear, Grade, AttendanceStatus, AttendanceRegister } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string; bg: string; text: string; icon: React.ReactNode
}> = {
  PRESENT:        { label: 'Present',        bg: 'bg-green-100',  text: 'text-green-700',  icon: <CheckCircle2 className="h-4 w-4" /> },
  ABSENT:         { label: 'Absent',         bg: 'bg-red-100',    text: 'text-red-700',    icon: <XCircle className="h-4 w-4" /> },
  LATE:           { label: 'Late',           bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-4 w-4" /> },
  EXCUSED_ABSENT: { label: 'Excused Absent', bg: 'bg-gray-100',   text: 'text-gray-600',   icon: <CheckCircle2 className="h-4 w-4 opacity-50" /> },
}

function pct(val: number, max = 100) {
  return Math.round(Math.min(Math.max(val, 0), max))
}

// ─── Take Register Modal ──────────────────────────────────────────────────────
function TakeRegisterModal({
  onClose,
  onCreated,
  allClasses,
}: {
  onClose: () => void
  onCreated: (registerId: string) => void
  allClasses: Array<{ id: string; name: string; grade: any }>
}) {
  const [classId, setClassId] = useState('')
  const [date,    setDate]    = useState(todayISO())
  const [error,   setError]   = useState('')

  // Fetch current academic year + term
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 10 * 60_000,
  })
  const currentAY   = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const academicYearId = currentAY?.id ?? ''
  const terms          = currentAY?.terms ?? []
  // Pick the active term (today falls within startDate–endDate) or the first term
  const today = todayISO()
  const activeTerm = terms.find((t: any) => t.startDate <= today && t.endDate >= today)
    ?? terms[0]
  const termId = activeTerm?.id ?? ''

  const mutation = useMutation({
    mutationFn: () => attendanceApi.getOrCreateRegister({ classId, date, academicYearId, termId }),
    onSuccess:  (data) => {
      onCreated(data.register.id)
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to open register'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Take Attendance Register</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Class *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select class…</option>
              {allClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  Gr{c.grade?.gradeNumber} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!classId || !date || !academicYearId || !termId || mutation.isPending}
            onClick={() => mutation.mutate()}
            title={!academicYearId ? 'No active academic year found' : !termId ? 'No active term found' : ''}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {mutation.isPending
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Opening…</>
              : <><Plus className="h-4 w-4" /> Open Register</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Register Capture View ────────────────────────────────────────────────────
function RegisterCapture({
  registerId, onBack,
}: {
  registerId: string
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const [localRecords, setLocalRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({})
  const [saved, setSaved] = useState(false)

  const { data: register, isLoading } = useQuery<AttendanceRegister>({
    queryKey: ['register', registerId],
    queryFn:  () => attendanceApi.getRegister(registerId),
  })

  // Initialise local records once the register loads
  React.useEffect(() => {
    if (!register?.attendanceRecords) return
    const init: Record<string, { status: AttendanceStatus; notes: string }> = {}
    register.attendanceRecords.forEach((r) => {
      init[r.learnerId] = { status: r.status, notes: r.notes ?? '' }
    })
    setLocalRecords(init)
  }, [register])

  const markMutation = useMutation({
    mutationFn: () => attendanceApi.markAttendance(registerId, {
      records: Object.entries(localRecords).map(([learnerId, { status, notes }]) => ({
        learnerId, status, notes: notes || undefined,
      })),
    }),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['registers'] })
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const setStatus = (learnerId: string, status: AttendanceStatus) => {
    setLocalRecords((prev) => ({ ...prev, [learnerId]: { ...prev[learnerId], status } }))
  }

  const markAll = (status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], status } })
      return next
    })
  }

  if (isLoading) return <div className="text-sm text-gray-400 py-12 text-center">Loading register…</div>
  if (!register) return <div className="text-sm text-red-500 py-12 text-center">Register not found.</div>

  const records = register.attendanceRecords ?? []
  const counts = records.reduce((acc: Record<string, number>, r) => {
    const status = localRecords[r.learnerId]?.status ?? r.status
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ChevronLeft className="h-4 w-4" /> Back to registers
      </button>

      {/* Register header */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {register.class?.grade ? `Grade ${register.class.grade.gradeNumber} — ` : ''}
              {register.class?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(register.date).toLocaleDateString('en-ZA', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {register.teacher && ` · ${register.teacher.firstName} ${register.teacher.lastName}`}
            </p>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED_ABSENT'] as AttendanceStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <span key={s} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.icon} {counts[s] ?? 0}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Mark all:</span>
        {(['PRESENT', 'ABSENT', 'LATE'] as AttendanceStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <button key={s} onClick={() => markAll(s)}
              className={`text-xs font-medium px-3 py-1 rounded-lg ${cfg.bg} ${cfg.text} hover:opacity-80 transition-opacity`}>
              All {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Learner list */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Learner</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Student No.</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record, idx) => {
              const current = localRecords[record.learnerId]?.status ?? record.status
              const cfg = STATUS_CONFIG[current]
              return (
                <tr key={record.learnerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {record.learner?.lastName}, {record.learner?.firstName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {record.learner?.studentNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED_ABSENT'] as AttendanceStatus[]).map((s) => {
                        const c = STATUS_CONFIG[s]
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(record.learnerId, s)}
                            title={c.label}
                            className={[
                              'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                              current === s
                                ? `${c.bg} ${c.text} ring-2 ring-offset-1 ${
                                    s === 'PRESENT' ? 'ring-green-400' :
                                    s === 'ABSENT'  ? 'ring-red-400'   :
                                    s === 'LATE'    ? 'ring-yellow-400' : 'ring-gray-400'
                                  }`
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
                            ].join(' ')}
                          >
                            {s === 'EXCUSED_ABSENT' ? 'Exc' : c.label}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Attendance saved
          </span>
        )}
        {!saved && <span />}
        <button
          onClick={() => markMutation.mutate()}
          disabled={markMutation.isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg shadow-sm"
        >
          {markMutation.isPending ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────
function SummaryTab({ allClasses }: { allClasses: Array<{ id: string; name: string; grade: any }> }) {
  const [classId, setClassId] = useState(allClasses[0]?.id ?? '')

  // Academic year terms for term filter
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 10 * 60_000,
  })
  const currentAY  = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const terms      = currentAY?.terms ?? []
  const [termId, setTermId] = useState('')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['class-attendance-summary', classId, termId],
    queryFn:  () => attendanceApi.getClassSummary(classId, termId || undefined),
    enabled:  !!classId,
    staleTime: 60_000,
  })

  const selectedClass = allClasses.find((c) => c.id === classId)

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {allClasses.map((c) => (
              <option key={c.id} value={c.id}>Gr{c.grade?.gradeNumber} — {c.name}</option>
            ))}
          </select>
        </div>

        {terms.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All terms</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading summary…
        </div>
      ) : !summary ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <BarChart2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Select a class to view its attendance summary.</p>
        </div>
      ) : (summary.learnerSummaries ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No attendance records captured yet for this class.</p>
          <p className="text-xs text-gray-400 mt-1">Open the Registers tab and capture daily attendance to see summaries here.</p>
        </div>
      ) : (
        <>
          {/* Class-level overview */}
          <div className="bg-white rounded-xl shadow-card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              {selectedClass ? `Gr${selectedClass.grade?.gradeNumber} — ${selectedClass.name}` : 'Class'} · Overall Summary
            </h2>
            {(() => {
              const learners = summary.learnerSummaries
              const totalDays = summary.totalDays ?? 0
              const avgRate = learners.length > 0
                ? Math.round(learners.reduce((s, l) => s + (l.attendancePercent ?? 0), 0) / learners.length)
                : 0
              const atRiskCount = learners.filter((l) => l.isAtRisk).length

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'School Days',      value: totalDays,                    color: 'text-gray-900'    },
                    { label: 'Avg Attendance',   value: `${avgRate}%`,                color: avgRate >= 80 ? 'text-emerald-600' : 'text-red-600' },
                    { label: 'Learners',         value: learners.length,              color: 'text-gray-900'    },
                    { label: 'Below 80%',        value: atRiskCount,                  color: atRiskCount > 0 ? 'text-red-600' : 'text-emerald-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Per-learner table */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-gray-900">Learner Attendance Breakdown</h3>
              <span className="text-xs text-gray-400 ml-auto">{summary.totalDays} school day{summary.totalDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Learner</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Present</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Absent</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Late</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Excused</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary.learnerSummaries
                    .slice()
                    .sort((a, b) => (a.attendancePercent ?? 0) - (b.attendancePercent ?? 0))
                    .map((ls) => {
                    const rate      = ls.attendancePercent ?? 0
                    const isAtRisk  = ls.isAtRisk ?? rate < 80

                    return (
                      <tr key={ls.learnerId} className={`hover:bg-gray-50 ${isAtRisk ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {ls.learner ? `${ls.learner.lastName}, ${ls.learner.firstName}` : ls.learnerId}
                          </p>
                          {ls.learner?.studentNumber && (
                            <p className="text-xs text-gray-400 font-mono">{ls.learner.studentNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-green-700">{ls.present ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${(ls.absent ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {ls.absent ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${(ls.late ?? 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {ls.late ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-400">{ls.excused ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  rate >= 90 ? 'bg-emerald-500' :
                                  rate >= 80 ? 'bg-green-400'   :
                                  rate >= 60 ? 'bg-amber-400'   : 'bg-red-500'
                                }`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-10 text-right tabular-nums ${isAtRisk ? 'text-red-600' : 'text-gray-700'}`}>
                              {rate}%
                            </span>
                            {isAtRisk && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-red-500" /> Below 80% — at risk (DOE threshold)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 bg-emerald-500 rounded-full inline-block" /> 90%+
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 bg-amber-400 rounded-full inline-block" /> 60–79%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 bg-red-500 rounded-full inline-block" /> &lt;60%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const queryClient = useQueryClient()
  const [tab, setTab]                   = useState<'registers' | 'summary'>('registers')
  const [selectedRegisterId, setRegId]  = useState<string | null>(null)
  const [classFilter, setClassFilter]   = useState('')
  const [dateFilter, setDateFilter]     = useState(todayISO())
  const [page, setPage]                 = useState(1)
  const [showTakeRegister, setShowTakeRegister] = useState(false)

  // Grades + classes for filter
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
  })
  const allClasses = (grades as Grade[]).flatMap((g) =>
    (g.classes ?? []).map((c) => ({ ...c, grade: g }))
  )

  // Registers
  const { data: registersData, isLoading } = useQuery({
    queryKey: ['registers', { classFilter, dateFilter, page }],
    queryFn:  () => attendanceApi.listRegisters({
      classId:   classFilter   || undefined,
      startDate: dateFilter    || undefined,
      endDate:   dateFilter    || undefined,
      page,
      limit: 20,
    }),
    enabled: tab === 'registers',
  })

  // Today's register counts (all classes, today only) for the overview strip
  const todayStr = todayISO()
  const { data: todayRegistersData } = useQuery({
    queryKey: ['registers-today', todayStr],
    queryFn:  () => attendanceApi.listRegisters({ startDate: todayStr, endDate: todayStr, limit: 50 }),
    enabled:  tab === 'registers' && dateFilter === todayStr,
    staleTime: 30_000,
  })
  const todayCapturedClassIds = new Set(
    (todayRegistersData?.data ?? []).map((r: any) => r.classId)
  )

  const registers  = registersData?.data ?? []
  const meta       = registersData?.meta

  // Open a register (navigate to capture view)
  if (selectedRegisterId) {
    return (
      <div className="animate-fade-in">
        <RegisterCapture
          registerId={selectedRegisterId}
          onBack={() => setRegId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <span className="absolute right-3 bottom-1 text-[3.75rem] font-black text-white/10 leading-none select-none" aria-hidden="true">P/(P+A)</span>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Attendance</h1>
            <p className="text-sm text-teal-100 mt-0.5">
              Daily attendance registers — capture and review
            </p>
          </div>
          <button
            onClick={() => setShowTakeRegister(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 bg-white rounded-lg hover:bg-teal-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Take Register
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {[
            { key: 'registers', label: 'Registers' },
            { key: 'summary',   label: 'Class Summary'   },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'registers' | 'summary')}
              className={['pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'].join(' ')}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'registers' && (
        <div className="space-y-4">
          {/* Today's class register overview strip */}
          {dateFilter === todayStr && allClasses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-teal-500" />
                <p className="text-sm font-semibold text-gray-900">Today&apos;s Register Status</p>
                <span className="text-xs text-gray-400 ml-auto">
                  {todayCapturedClassIds.size}/{allClasses.length} captured
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allClasses.map((cls) => {
                  const captured = todayCapturedClassIds.has(cls.id)
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        if (captured) {
                          const r = (todayRegistersData?.data ?? []).find((reg: any) => reg.classId === cls.id)
                          if (r) setRegId(r.id)
                        } else {
                          setShowTakeRegister(true)
                          setClassFilter(cls.id)
                        }
                      }}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        captured
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${captured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      Gr{cls.grade?.gradeNumber} {cls.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                className="text-sm text-gray-700 focus:outline-none"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All classes</option>
              {allClasses.map((c: any) => (
                <option key={c.id} value={c.id}>Gr{c.grade?.gradeNumber} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Register list */}
          {isLoading ? (
            <div className="text-sm text-gray-400 py-12 text-center">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading registers…
            </div>
          ) : registers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">No registers found for the selected filters.</p>
              <p className="text-xs text-gray-400 mb-4">
                Use the "Take Register" button to open a register for a class.
              </p>
              <button
                onClick={() => setShowTakeRegister(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> Take Register
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date', 'Class', 'Teacher', 'Learners', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(registers as AttendanceRegister[]).map((r) => {
                    const total = r._count?.attendanceRecords ?? 0
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setRegId(r.id)}>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {new Date(r.date).toLocaleDateString('en-ZA', {
                            weekday: 'short', month: 'short', day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {r.class?.grade ? (
                            <span className="text-xs text-gray-400 mr-1">
                              Gr{r.class.grade.gradeNumber}
                            </span>
                          ) : null}
                          <span className="font-medium text-gray-900">{r.class?.name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {r.teacher?.firstName} {r.teacher?.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{total}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                            Captured
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setRegId(r.id) }}
                            className="text-xs text-primary-600 hover:underline font-medium"
                          >
                            View / Edit →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{meta.total} register{meta.total !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">Page {page} of {meta.totalPages}</span>
                <button disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'summary' && (
        allClasses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
            No classes available.
          </div>
        ) : (
          <SummaryTab allClasses={allClasses} />
        )
      )}

      {/* Take Register Modal */}
      {showTakeRegister && (
        <TakeRegisterModal
          onClose={() => setShowTakeRegister(false)}
          onCreated={(id) => {
            queryClient.invalidateQueries({ queryKey: ['registers'] })
            setRegId(id)
          }}
          allClasses={allClasses}
        />
      )}
    </div>
  )
}
