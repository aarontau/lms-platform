'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, Plus, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, BookOpen, Users, Search, ArrowUpRight,
} from 'lucide-react'
import { assessmentApi, subjectsApi, academicYearsApi } from '@/lib/api'
import type { AcademicYear, ProgrammeOfAssessment, PoaStatus, SubjectClass } from '@/types'

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<PoaStatus, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  APPROVED:  'bg-green-100 text-green-700',
}
const STATUS_ICONS: Record<PoaStatus, React.ReactNode> = {
  DRAFT:     <Clock className="h-3 w-3" />,
  SUBMITTED: <AlertTriangle className="h-3 w-3" />,
  APPROVED:  <CheckCircle2 className="h-3 w-3" />,
}
function StatusBadge({ status }: { status: PoaStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {STATUS_ICONS[status]}
      {status}
    </span>
  )
}

// ─── Create POA Modal ─────────────────────────────────────────────────────────
function CreatePoaModal({
  onClose,
  subjectClasses,
}: {
  onClose: () => void
  subjectClasses: SubjectClass[]
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    subjectClassId:     '',
    termId:             '',
    totalTasksRequired: 4,
  })
  const [error, setError] = useState('')

  // Derive available terms from the selected subject class's academic year
  const selectedSc = subjectClasses.find((sc) => sc.id === form.subjectClassId)

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
  })

  const terms = React.useMemo(() => {
    if (!selectedSc?.academicYearId) return []
    const ay = (academicYears as AcademicYear[]).find((a) => a.id === selectedSc.academicYearId)
    return ay?.terms ?? []
  }, [selectedSc?.academicYearId, academicYears])

  const mutation = useMutation({
    mutationFn: () => assessmentApi.createPoa(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poas'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to create POA'),
  })

  const canSubmit = form.subjectClassId && form.termId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          New Programme of Assessment
        </h3>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject Class</label>
            <select
              value={form.subjectClassId}
              onChange={(e) => setForm((f) => ({ ...f, subjectClassId: e.target.value, termId: '' }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select subject class…</option>
              {subjectClasses.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.schoolSubject?.name}
                  {sc.class?.grade ? ` — Grade ${sc.class.grade.gradeNumber}` : ''}
                  {sc.class ? ` ${sc.class.name}` : ''}
                  {sc.teacher ? ` (${sc.teacher.firstName} ${sc.teacher.lastName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
            <select
              value={form.termId}
              onChange={(e) => setForm((f) => ({ ...f, termId: e.target.value }))}
              disabled={!form.subjectClassId}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select term…</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>
                  Term {t.termNumber} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Target number of tasks
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.totalTasksRequired}
              onChange={(e) => setForm((f) => ({ ...f, totalTasksRequired: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Advisory only — you can add tasks beyond this count.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg"
          >
            {mutation.isPending ? 'Creating…' : 'Create POA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── POA Card ─────────────────────────────────────────────────────────────────
function PoaCard({ poa }: { poa: ProgrammeOfAssessment }) {
  const router = useRouter()
  const taskCount    = poa.assessmentTasks?.length ?? 0
  const targetTasks  = poa.totalTasksRequired
  const completedPct = targetTasks > 0 ? Math.min((taskCount / targetTasks) * 100, 100) : null

  return (
    <button
      onClick={() => router.push(`/assessment/poa/${poa.id}`)}
      className="bg-white rounded-xl shadow-card p-4 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {poa.subjectClass?.schoolSubject?.name ?? 'Unknown Subject'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {poa.subjectClass?.class?.grade
              ? `Grade ${poa.subjectClass.class.grade.gradeNumber} — `
              : ''}
            {poa.subjectClass?.class?.name ?? ''}
          </p>
        </div>
        <StatusBadge status={poa.status as PoaStatus} />
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {poa.term?.name ?? 'Unknown Term'}
        {poa.subjectClass?.teacher && (
          <> &middot; {poa.subjectClass.teacher.firstName} {poa.subjectClass.teacher.lastName}</>
        )}
      </p>

      {/* Task progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${completedPct ?? 0}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {taskCount}{targetTasks > 0 ? `/${targetTasks}` : ''} tasks
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState<PoaStatus | ''>('')
  const [search, setSearch] = useState('')

  const { data: poas = [], isLoading } = useQuery({
    queryKey: ['poas', filterStatus],
    queryFn:  () => assessmentApi.listPoas(filterStatus ? { status: filterStatus } : {}),
  })

  const { data: subjectClasses = [] } = useQuery({
    queryKey: ['subject-classes'],
    queryFn:  () => subjectsApi.getSubjectClasses(),
  })

  const filtered = (poas as ProgrammeOfAssessment[]).filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.subjectClass?.schoolSubject?.name?.toLowerCase().includes(q) ||
      p.subjectClass?.class?.name?.toLowerCase().includes(q) ||
      p.subjectClass?.teacher?.firstName?.toLowerCase().includes(q) ||
      p.subjectClass?.teacher?.lastName?.toLowerCase().includes(q) ||
      p.term?.name?.toLowerCase().includes(q)
    )
  })

  const byStatus = {
    DRAFT:     filtered.filter((p) => p.status === 'DRAFT'),
    SUBMITTED: filtered.filter((p) => p.status === 'SUBMITTED'),
    APPROVED:  filtered.filter((p) => p.status === 'APPROVED'),
  }

  const statusOrder: PoaStatus[] = ['SUBMITTED', 'DRAFT', 'APPROVED']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <span className="absolute right-4 bottom-1 text-[5rem] font-black text-white/10 leading-none select-none" aria-hidden="true">∑/n</span>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Assessment</h1>
            <p className="text-sm text-blue-200 mt-0.5">
              Manage Programmes of Assessment and capture learner marks
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New POA
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects, classes…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'DRAFT', 'SUBMITTED', 'APPROVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                filterStatus === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400',
              ].join(' ')}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total POAs',     value: poas.length,                gradient: 'bg-gradient-to-br from-primary-600 to-primary-500' },
          { label: 'Drafts',         value: byStatus.DRAFT.length,      gradient: 'bg-gradient-to-br from-slate-500 to-slate-400'    },
          { label: 'Pending Review', value: byStatus.SUBMITTED.length,  gradient: 'bg-gradient-to-br from-amber-500 to-orange-500'   },
          { label: 'Approved',       value: byStatus.APPROVED.length,   gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-xl p-4 shadow-md ${stat.gradient}`}>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
            <p className="text-xs font-medium text-white/80 relative">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1 relative tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* POA Grid — grouped by status */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No Programmes of Assessment yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "New POA" to create one for a subject class.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {statusOrder
            .filter((s) => byStatus[s].length > 0)
            .map((s) => (
              <div key={s}>
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={s} />
                  <span className="text-xs text-gray-400">{byStatus[s].length} POA{byStatus[s].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {byStatus[s].map((poa) => (
                    <PoaCard key={poa.id} poa={poa} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {showCreate && (
        <CreatePoaModal
          onClose={() => setShowCreate(false)}
          subjectClasses={subjectClasses as SubjectClass[]}
        />
      )}
    </div>
  )
}
