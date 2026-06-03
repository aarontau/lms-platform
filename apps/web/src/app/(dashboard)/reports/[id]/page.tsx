'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle2, Clock, Send, RefreshCw,
  User, BookOpen, Calendar, Activity, Printer,
  AlertTriangle, Award,
} from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi, schoolsApi } from '@/lib/api'
import type { ReportCardDetail, School } from '@/types'

// ─── CAPS Performance Level helpers ──────────────────────────────────────────

function perfLevel(pct: number): { level: number; label: string } {
  if (pct >= 80) return { level: 7, label: 'Outstanding' }
  if (pct >= 70) return { level: 6, label: 'Meritorious' }
  if (pct >= 60) return { level: 5, label: 'Substantial' }
  if (pct >= 50) return { level: 4, label: 'Adequate' }
  if (pct >= 40) return { level: 3, label: 'Moderate' }
  if (pct >= 30) return { level: 2, label: 'Elementary' }
  return { level: 1, label: 'Not Achieved' }
}

function levelColor(level: number) {
  if (level >= 6) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (level >= 4) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (level >= 3) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function barColor(level: number) {
  if (level >= 6) return 'bg-emerald-500'
  if (level >= 4) return 'bg-amber-500'
  if (level >= 3) return 'bg-orange-400'
  return 'bg-red-500'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportCardDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const router     = useRouter()
  const qc         = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-card', id],
    queryFn:  () => reportsApi.getReportCard(id),
  })

  const { data: school } = useQuery({
    queryKey: ['my-school'],
    queryFn:  () => schoolsApi.getMy(),
    staleTime: 10 * 60_000,
  })

  const publishMutation = useMutation({
    mutationFn: () => reportsApi.publishReport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-card', id] })
      qc.invalidateQueries({ queryKey: ['report-cards'] })
    },
  })

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Loading report card…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="py-24 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto text-red-400 mb-3" />
        <p className="text-sm text-gray-500">Report card not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-primary-600 hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const { card, sbaResults, attendance } = data as ReportCardDetail

  const learnerName  = `${card.learner.firstName} ${card.learner.lastName}`
  const termLabel    = card.term ? `Term ${card.term.termNumber} — ${card.term.name}` : 'Annual'
  const yearLabel    = card.academicYear?.year ?? ''
  const isPublished  = card.status === 'PUBLISHED'

  // Sort subjects by name
  const subjects = [...sbaResults].sort((a, b) =>
    (a.subjectClass?.schoolSubject?.name ?? '').localeCompare(b.subjectClass?.schoolSubject?.name ?? '')
  )

  // Average SBA %
  const avgSba = subjects.length
    ? subjects.reduce((s, r) => s + Number(r.sbaTotalPercentage), 0) / subjects.length
    : 0

  const totalDays = attendance.present + attendance.absent + attendance.late
  const attendancePct = totalDays > 0
    ? Math.round(((attendance.present + attendance.late) / totalDays) * 100)
    : 0

  const { level: avgLevel, label: avgLabel } = perfLevel(avgSba)

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Report Cards
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          {!isPublished && (
            <button
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
            >
              {publishMutation.isPending
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Publishing…</>
                : <><Send className="h-4 w-4" /> Publish Report</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Report card header ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-400">
        {/* Coloured top bar */}
        <div className={`h-2 w-full ${isPublished ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

        <div className="px-6 py-5">
          {/* School + title */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                {(school as School | undefined)?.name ?? 'School Report Card'}
                {school?.district && typeof school.district === 'object' ? ` — ${school.district.name}` : ''}
              </p>
              <h1 className="text-xl font-bold text-gray-900">
                Learner Progress Report
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {termLabel} &bull; {yearLabel}
              </p>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
              isPublished
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isPublished
                ? <><CheckCircle2 className="h-4 w-4" /> Published</>
                : <><Clock className="h-4 w-4" /> Draft</>
              }
            </span>
          </div>

          {/* Learner info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold uppercase flex-shrink-0 text-sm">
                {card.learner.firstName[0]}{card.learner.lastName[0]}
              </div>
              <div>
                <p className="text-2xs text-gray-400 uppercase font-semibold tracking-wide">Learner</p>
                <p className="text-sm font-semibold text-gray-900">{learnerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-2xs text-gray-400 uppercase font-semibold tracking-wide">Admission No.</p>
                <p className="text-sm font-semibold text-gray-900">
                  {card.learner.admissionNumber ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-2xs text-gray-400 uppercase font-semibold tracking-wide">Term</p>
                <p className="text-sm font-semibold text-gray-900">{termLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Award className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-2xs text-gray-400 uppercase font-semibold tracking-wide">Avg. SBA</p>
                <p className={`text-sm font-bold ${avgSba >= 50 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {avgSba.toFixed(1)}% — L{avgLevel} {avgLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subjects table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-400">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <BookOpen className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Subject Results — {termLabel}</h2>
          <span className="ml-auto text-xs text-gray-400">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
        </div>

        {subjects.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No SBA results captured yet for this term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SBA %</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Progress</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subjects.map((res) => {
                  const pct   = Number(res.sbaTotalPercentage)
                  const { level, label } = perfLevel(pct)
                  const subjectName = res.subjectClass?.schoolSubject?.name ?? '—'

                  return (
                    <tr key={res.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{subjectName}</p>
                        {res.subjectClass?.schoolSubject?.capsSubject?.name && (
                          <p className="text-xs text-gray-400">
                            {res.subjectClass.schoolSubject.capsSubject.name}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-mono text-gray-600">
                          {res.tasksCompleted}/{res.tasksTotal}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-bold tabular-nums ${pct >= 50 ? 'text-gray-900' : 'text-red-600'}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="w-28 mx-auto">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor(level)}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${levelColor(level)}`}>
                          {level}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        {res.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Average row */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td className="px-5 py-3 font-bold text-gray-700" colSpan={2}>
                    Overall Average
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold tabular-nums ${avgSba >= 50 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {avgSba.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="w-28 mx-auto">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor(avgLevel)}`}
                          style={{ width: `${Math.min(avgSba, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${levelColor(avgLevel)}`}>
                      {avgLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-xs font-semibold text-gray-500">{avgLabel}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Attendance + CAPS scale ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-400">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Activity className="h-4 w-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Attendance Summary</h2>
          </div>
          <div className="px-5 py-5">
            {totalDays === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No attendance data captured yet.</p>
            ) : (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-4xl font-bold tabular-nums ${attendancePct >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {attendancePct}%
                  </span>
                  <span className="text-sm text-gray-500 mb-1">attendance rate</span>
                </div>

                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${attendancePct >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Present', value: attendance.present, color: 'text-emerald-700' },
                    { label: 'Late',    value: attendance.late,    color: 'text-amber-600'   },
                    { label: 'Absent',  value: attendance.absent,  color: 'text-red-600'     },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 py-3">
                      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-2xs text-gray-500 font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CAPS Performance Scale */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-400">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Award className="h-4 w-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">CAPS Performance Scale</h2>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-1.5">
              {[
                { level: 7, label: 'Outstanding Achievement',      range: '80–100%', color: 'bg-emerald-500' },
                { level: 6, label: 'Meritorious Achievement',      range: '70–79%',  color: 'bg-teal-500'   },
                { level: 5, label: 'Substantial Achievement',      range: '60–69%',  color: 'bg-blue-500'   },
                { level: 4, label: 'Adequate Achievement',         range: '50–59%',  color: 'bg-indigo-400' },
                { level: 3, label: 'Moderate Achievement',         range: '40–49%',  color: 'bg-amber-500'  },
                { level: 2, label: 'Elementary Achievement',       range: '30–39%',  color: 'bg-orange-500' },
                { level: 1, label: 'Not Achieved',                 range: '0–29%',   color: 'bg-red-500'    },
              ].map(({ level, label, range, color }) => (
                <div key={level} className="flex items-center gap-2.5">
                  <div className={`h-5 w-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${color}`}>
                    {level}
                  </div>
                  <span className="text-xs text-gray-700 flex-1">{label}</span>
                  <span className="text-xs font-mono text-gray-400">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      {isPublished && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>
              Published{card.publishedAt ? ` on ${format(new Date(card.publishedAt), 'd MMMM yyyy')}` : ''}
              {card.publishedBy ? ` by ${card.publishedBy.firstName} ${card.publishedBy.lastName}` : ''}.
              This report is visible in the parent portal.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
