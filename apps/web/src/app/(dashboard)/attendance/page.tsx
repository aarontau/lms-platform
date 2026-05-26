'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Users, ChevronLeft, ChevronRight, Calendar,
  Search, Filter,
} from 'lucide-react'
import { attendanceApi, gradesApi } from '@/lib/api'
import type { AttendanceStatus, AttendanceRegister } from '@/types'

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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const queryClient = useQueryClient()
  const [tab, setTab]                   = useState<'registers' | 'summary'>('registers')
  const [selectedRegisterId, setRegId]  = useState<string | null>(null)
  const [classFilter, setClassFilter]   = useState('')
  const [dateFilter, setDateFilter]     = useState(todayISO())
  const [page, setPage]                 = useState(1)

  // Grades + classes for filter
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  gradesApi.getAll,
  })
  const allClasses = (grades as any[]).flatMap((g: any) =>
    (g.classes ?? []).map((c: any) => ({ ...c, grade: g }))
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
  })

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
        <Users className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Attendance</h1>
          <p className="text-sm text-teal-100 mt-0.5">
            Daily attendance registers — capture and review
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {[
            { key: 'registers', label: 'Registers' },
            { key: 'summary',   label: 'Summary'   },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={['pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'].join(' ')}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'registers' && (
        <div className="space-y-4">
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
            <div className="text-sm text-gray-400 py-12 text-center">Loading registers…</div>
          ) : registers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No registers found for the selected filters.</p>
              <p className="text-xs text-gray-400 mt-1">
                Teachers open a register for their class each day.
              </p>
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
        <div className="bg-white rounded-xl shadow-card p-6 text-center text-sm text-gray-500">
          <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p>Class-wide attendance summaries will be available once registers have been captured.</p>
          <p className="text-xs text-gray-400 mt-1">
            Select a class from the registers tab and open it to view attendance records.
          </p>
        </div>
      )}
    </div>
  )
}
