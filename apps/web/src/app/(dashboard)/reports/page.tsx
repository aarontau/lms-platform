'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart2, FileText, CheckCircle2, Clock,
  AlertTriangle, Send, ChevronRight, Search,
  RefreshCw, Users, TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi } from '@/lib/api'
import { gradesApi }   from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────
type ReportStatus = 'DRAFT' | 'PUBLISHED'

interface ReportCard {
  id:            string
  status:        ReportStatus
  reportType:    string
  publishedAt:   string | null
  createdAt:     string
  learner: {
    id:              string
    firstName:       string
    lastName:        string
    admissionNumber: string | null
  }
  term: {
    id:         string
    name:       string
    termNumber: number
  } | null
  academicYear: {
    id:   string
    year: number
  }
  publishedBy: {
    firstName: string
    lastName:  string
  } | null
}

interface AtRiskRecord {
  id:                string
  sbaTotalPercentage: number
  isAtRisk:           boolean
  learner: {
    id:              string
    firstName:       string
    lastName:        string
    admissionNumber: string | null
  }
  subjectClass: {
    schoolSubject: { name: string }
    class: {
      name:  string
      grade: { gradeNumber: number; name: string } | null
    }
  }
  term: { name: string; termNumber: number }
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: ReportStatus }) {
  if (status === 'PUBLISHED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" />
      Draft
    </span>
  )
}

// ─── Generate modal ───────────────────────────────────────────────────────────
function GenerateModal({
  onClose,
  terms,
  classes,
}: {
  onClose: () => void
  terms:   Array<{ id: string; name: string; termNumber: number }>
  classes: Array<{ id: string; name: string; grade?: { gradeNumber: number; name: string } }>
}) {
  const queryClient = useQueryClient()
  const [termId,   setTermId]   = useState('')
  const [classId,  setClassId]  = useState('')
  const [result,   setResult]   = useState<{ generated: number; skipped: number; total: number } | null>(null)
  const [error,    setError]    = useState('')

  const mutation = useMutation({
    mutationFn: () => reportsApi.generateTermReports({ termId, classId }),
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['report-cards'] })
    },
    onError: (e: any) =>
      setError(e?.response?.data?.message ?? 'Failed to generate report cards'),
  })

  const canSubmit = termId && classId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Generate Report Cards</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Creates a DRAFT report card for every active learner in the selected class.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {result ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-green-800">Done!</p>
              <p className="text-sm text-green-700 mt-1">
                <span className="font-bold">{result.generated}</span> new report cards created
                {result.skipped > 0 && `, ${result.skipped} already existed`}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Term
                </label>
                <select
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      Term {t.termNumber} — {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Class
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade ? `Grade ${c.grade.gradeNumber} — ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              {mutation.isPending ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><FileText className="h-4 w-4" /> Generate</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const queryClient = useQueryClient()

  const [tab,            setTab]            = useState<'cards' | 'at-risk'>('cards')
  const [showGenModal,   setShowGenModal]   = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [statusFilter,   setStatusFilter]   = useState<ReportStatus | ''>('')
  const [publishingId,   setPublishingId]   = useState<string | null>(null)

  // Fetch report cards
  const { data: reportCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['report-cards', statusFilter],
    queryFn: () => reportsApi.listReportCards(statusFilter ? { status: statusFilter } : {}),
  })

  // Fetch at-risk learners
  const { data: atRisk = [], isLoading: atRiskLoading } = useQuery({
    queryKey: ['at-risk'],
    queryFn:  () => reportsApi.getAtRiskSummary(),
  })

  // Fetch grades to get classes for generate modal
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) => reportsApi.publishReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] })
      setPublishingId(null)
    },
  })

  // Filter report cards by search
  const filtered = (reportCards as ReportCard[]).filter((card) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      `${card.learner.firstName} ${card.learner.lastName}`.toLowerCase().includes(q) ||
      card.learner.admissionNumber?.toLowerCase().includes(q) ||
      card.term?.name.toLowerCase().includes(q)
    )
  })

  // Stats
  const totalCards     = (reportCards as ReportCard[]).length
  const publishedCards = (reportCards as ReportCard[]).filter((c) => c.status === 'PUBLISHED').length
  const draftCards     = totalCards - publishedCards
  const atRiskCount    = (atRisk as AtRiskRecord[]).length

  // Collect terms from report cards for the generate modal
  const termSet = new Map<string, { id: string; name: string; termNumber: number }>()
  ;(reportCards as ReportCard[]).forEach((c) => {
    if (c.term) termSet.set(c.term.id, c.term)
  })
  const terms = Array.from(termSet.values())

  // Collect classes from grades
  const classes = (grades as any[]).flatMap((g: any) =>
    (g.classes ?? []).map((c: any) => ({ ...c, grade: g }))
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <BarChart2 className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Reports</h1>
            <p className="text-sm text-rose-200 mt-0.5">
              Generate, review, and publish learner report cards
            </p>
          </div>
          <button
            onClick={() => setShowGenModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-white rounded-xl hover:bg-rose-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <FileText className="h-4 w-4" />
            Generate Reports
          </button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cards',   value: totalCards,     gradient: 'bg-gradient-to-br from-slate-600 to-slate-500'   },
          { label: 'Published',     value: publishedCards, gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-500'},
          { label: 'Drafts',        value: draftCards,     gradient: 'bg-gradient-to-br from-amber-500 to-orange-500'  },
          { label: 'At-Risk Flags', value: atRiskCount,    gradient: 'bg-gradient-to-br from-red-600 to-red-500'       },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-xl p-4 shadow-md ${stat.gradient}`}>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
            <p className="text-xs font-medium text-white/80 relative">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1 relative tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'cards',   label: 'Report Cards', icon: FileText    },
            { key: 'at-risk', label: 'At-Risk Learners', icon: TrendingDown },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={[
                'pb-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors',
                tab === key
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'at-risk' && atRiskCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                  {atRiskCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Report Cards tab ──────────────────────────────────────────────── */}
      {tab === 'cards' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learner or term…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {(['', 'DRAFT', 'PUBLISHED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={[
                    'px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors',
                    statusFilter === s
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-rose-400',
                  ].join(' ')}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {cardsLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-gray-300" />
                Loading report cards…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-semibold text-gray-500">No report cards yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click &quot;Generate Reports&quot; to create draft report cards for a class.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Term</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Published</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                            {card.learner.firstName[0]}{card.learner.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {card.learner.firstName} {card.learner.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {card.learner.admissionNumber ?? 'No admission no.'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-gray-700 font-medium">{card.term?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{card.academicYear.year}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusChip status={card.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                        {card.publishedAt
                          ? format(new Date(card.publishedAt), 'd MMM yyyy')
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {card.status === 'DRAFT' && (
                            <button
                              onClick={() => {
                                setPublishingId(card.id)
                                publishMutation.mutate(card.id)
                              }}
                              disabled={publishMutation.isPending && publishingId === card.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-60"
                            >
                              {publishMutation.isPending && publishingId === card.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Publish
                            </button>
                          )}
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── At-Risk tab ────────────────────────────────────────────────────── */}
      {tab === 'at-risk' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {atRiskLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-gray-300" />
              Loading at-risk learners…
            </div>
          ) : (atRisk as AtRiskRecord[]).length === 0 ? (
            <div className="py-20 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-500">No at-risk learners</p>
              <p className="text-xs text-gray-400 mt-1">All learners are above the 40% SBA threshold.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Term</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">SBA %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(atRisk as AtRiskRecord[]).map((rec) => {
                  const sba = Number(rec.sbaTotalPercentage)
                  const color = sba < 20 ? 'text-red-700 bg-red-100' : 'text-orange-700 bg-orange-100'
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">
                          {rec.learner.firstName} {rec.learner.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{rec.learner.admissionNumber ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-700">
                        {rec.subjectClass.schoolSubject.name}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                        {rec.subjectClass.class.grade
                          ? `Grade ${rec.subjectClass.class.grade.gradeNumber} `
                          : ''}
                        {rec.subjectClass.class.name}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                        Term {rec.term.termNumber}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${color}`}>
                          {sba.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Generate modal ────────────────────────────────────────────────── */}
      {showGenModal && (
        <GenerateModal
          onClose={() => setShowGenModal(false)}
          terms={terms}
          classes={classes}
        />
      )}
    </div>
  )
}
