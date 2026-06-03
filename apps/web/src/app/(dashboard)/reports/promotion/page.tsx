'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, TrendingUp, AlertTriangle, RefreshCw,
  ChevronDown, Users, CheckCircle2, XCircle,
  Award, GraduationCap, Edit3, X, Save,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { reportsApi, gradesApi, academicYearsApi } from '@/lib/api'
import type { AcademicYear, Grade, PromotionDecision } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Recommendation = 'PROMOTE' | 'PROGRESS' | 'REPEAT'

const DECISION_CONFIG: Record<Recommendation, {
  label: string; bg: string; text: string; border: string; icon: React.ReactNode
}> = {
  PROMOTE:  {
    label:  'Promote',
    bg:     'bg-emerald-100',
    text:   'text-emerald-800',
    border: 'border-emerald-200',
    icon:   <TrendingUp className="h-3.5 w-3.5" />,
  },
  PROGRESS: {
    label:  'Progress (Condoned)',
    bg:     'bg-amber-100',
    text:   'text-amber-800',
    border: 'border-amber-200',
    icon:   <AlertTriangle className="h-3.5 w-3.5" />,
  },
  REPEAT:   {
    label:  'Repeat',
    bg:     'bg-red-100',
    text:   'text-red-800',
    border: 'border-red-200',
    icon:   <XCircle className="h-3.5 w-3.5" />,
  },
}

function DecisionChip({ decision, small = false }: { decision: Recommendation; small?: boolean }) {
  const cfg = DECISION_CONFIG[decision] ?? DECISION_CONFIG.PROMOTE
  return (
    <span className={`inline-flex items-center gap-1 font-semibold border rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Override modal ───────────────────────────────────────────────────────────

function OverrideModal({
  record,
  ayId,
  onClose,
}: {
  record: any
  ayId:   string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const learnerName = `${record.learner.firstName} ${record.learner.lastName}`
  const [finalDecision, setFinalDecision] = useState<Recommendation>(record.finalDecision)
  const [overrideReason, setOverrideReason] = useState(record.overrideReason ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => reportsApi.recordPromotionDecision({
      learnerId:      record.learnerId,
      academicYearId: ayId,
      finalDecision,
      isOverridden:   finalDecision !== record.recommendation,
      overrideReason: finalDecision !== record.recommendation ? overrideReason : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotion-decisions'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to update decision'),
  })

  const isOverriding = finalDecision !== record.recommendation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{learnerName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Auto-recommendation: <DecisionChip decision={record.recommendation} small />
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Final Decision
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PROMOTE', 'PROGRESS', 'REPEAT'] as Recommendation[]).map((d) => {
                const cfg = DECISION_CONFIG[d]
                return (
                  <button
                    key={d}
                    onClick={() => setFinalDecision(d)}
                    className={`py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      finalDecision === d
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-center mb-1">{cfg.icon}</div>
                    {cfg.label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {isOverriding && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Override Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Provide the reason for overriding the auto-recommendation…"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                This will be flagged as a principal override in the CAPS audit trail.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={mutation.isPending || (isOverriding && !overrideReason.trim())}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            {mutation.isPending
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
              : <><Save className="h-4 w-4" /> Save Decision</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionDecisionsPage() {
  const router = useRouter()
  const [classId,     setClassId]     = useState('')
  const [filterDec,   setFilterDec]   = useState<Recommendation | ''>('')
  const [overrideRec, setOverrideRec] = useState<any | null>(null)

  // Resolve current academic year
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 5 * 60_000,
  })
  const currentAY = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const ayId = currentAY?.id ?? ''

  // Fetch grades/classes for class filter
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
  })
  const classes = (grades as Grade[]).flatMap((g) =>
    (g.classes ?? []).map((c) => ({ ...c, grade: g }))
  )

  // Fetch promotion decisions
  const { data: decisions = [], isLoading } = useQuery<PromotionDecision[]>({
    queryKey: ['promotion-decisions', ayId, classId],
    queryFn:  () => reportsApi.listPromotionDecisions(ayId, classId || undefined),
    enabled:  !!ayId,
  })

  const all = decisions

  // Filter by decision
  const filtered = filterDec
    ? all.filter((d) => d.finalDecision === filterDec)
    : all

  // Summary counts
  const promoteCount  = all.filter((d) => d.finalDecision === 'PROMOTE').length
  const progressCount = all.filter((d) => d.finalDecision === 'PROGRESS').length
  const repeatCount   = all.filter((d) => d.finalDecision === 'REPEAT').length
  const overrideCount = all.filter((d) => d.isOverridden).length

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <GraduationCap className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-200 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Report Cards
            </button>
            <h1 className="text-xl font-bold text-white">CAPS Promotion Decisions</h1>
            <p className="text-sm text-purple-200 mt-0.5">
              2026 Academic Year — Auto-calculated from annual subject results
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm text-purple-200 font-medium">{all.length} learners</span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Promoted',          value: promoteCount,  gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
          { label: 'Progress (Condoned)',value: progressCount, gradient: 'bg-gradient-to-br from-amber-500 to-orange-500'   },
          { label: 'Repeat',            value: repeatCount,   gradient: 'bg-gradient-to-br from-red-600 to-red-500'         },
          { label: 'Principal Overrides',value: overrideCount, gradient: 'bg-gradient-to-br from-violet-600 to-purple-500' },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl p-4 shadow-md ${s.gradient}`}>
            <div className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10" />
            <p className="text-xs font-medium text-white/80 relative">{s.label}</p>
            <p className="text-3xl font-bold text-white mt-1 relative tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Class filter */}
        <div className="relative">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white appearance-none min-w-[160px]"
          >
            <option value="">All Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                Gr {c.grade?.gradeNumber} — {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Decision filter */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: '',         label: 'All'           },
            { key: 'PROMOTE',  label: 'Promoted'      },
            { key: 'PROGRESS', label: 'Progress'      },
            { key: 'REPEAT',   label: 'Repeat'        },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterDec(key as Recommendation)}
              className={[
                'px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors',
                filterDec === key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400',
              ].join(' ')}
            >
              {label}
              {key && (
                <span className="ml-1.5 opacity-70">
                  {key === 'PROMOTE' ? promoteCount : key === 'PROGRESS' ? progressCount : repeatCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Decisions table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-gray-300" />
            Loading promotion decisions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Award className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-500">No decisions found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filterDec ? 'Try clearing the filter.' : 'Annual results need to be calculated first.'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Auto-Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Final Decision</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Override</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((dec: any) => (
                  <tr key={dec.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                          {dec.learner.firstName[0]}{dec.learner.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {dec.learner.firstName} {dec.learner.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{dec.learner.admissionNumber ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <DecisionChip decision={dec.recommendation} small />
                    </td>

                    <td className="px-4 py-3.5">
                      <DecisionChip decision={dec.finalDecision} />
                    </td>

                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {dec.isOverridden ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            <Edit3 className="h-3 w-3" />
                            Overridden
                          </span>
                          {dec.overrideReason && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{dec.overrideReason}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Auto
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setOverrideRec(dec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-500">
              Showing {filtered.length} of {all.length} learners
              {overrideCount > 0 && (
                <span className="ml-2 text-violet-600 font-medium">
                  · {overrideCount} principal override{overrideCount > 1 ? 's' : ''} recorded
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── CAPS info box ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-violet-800">
            <p className="font-semibold mb-1">CAPS Promotion Guidelines — Senior Phase (Grade 7–9)</p>
            <ul className="text-xs text-violet-700 space-y-0.5 list-disc list-inside">
              <li><span className="font-semibold">Promote</span>: 0 subjects below the minimum threshold</li>
              <li><span className="font-semibold">Progress (Condoned)</span>: 1–2 subjects below threshold (principal discretion)</li>
              <li><span className="font-semibold">Repeat</span>: 3 or more subjects below the minimum threshold</li>
            </ul>
            <p className="text-xs text-violet-600 mt-2">
              Auto-recommendations are calculated from annual subject results.
              Principal overrides are recorded in the CAPS audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* ── Override modal ──────────────────────────────────────────────────── */}
      {overrideRec && (
        <OverrideModal
          record={overrideRec}
          ayId={ayId}
          onClose={() => setOverrideRec(null)}
        />
      )}
    </div>
  )
}
