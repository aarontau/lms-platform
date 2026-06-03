'use client'

import React, { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, Trash2, Save, AlertTriangle, CheckCircle2,
  ChevronDown, BookOpen, Users, TrendingUp, Clock,
  Edit2, X, Check,
} from 'lucide-react'
import { assessmentApi } from '@/lib/api'
import type {
  MarkbookRow, AssessmentTask, PoaStatus, TaskType,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_TYPES: TaskType[] = [
  'DIAGNOSTIC', 'CLASS_TEST', 'ASSIGNMENT',
  'HOMEWORK', 'ORAL', 'PRACTICAL', 'SUMMATIVE_EXAM',
]

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  DIAGNOSTIC:    'Diagnostic',
  CLASS_TEST:    'Class Test',
  ASSIGNMENT:    'Assignment',
  HOMEWORK:      'Homework',
  ORAL:          'Oral',
  PRACTICAL:     'Practical',
  SUMMATIVE_EXAM: 'Exam',
}

const POA_STATUS_NEXT: Partial<Record<PoaStatus, PoaStatus>> = {
  DRAFT:     'SUBMITTED',
  SUBMITTED: 'APPROVED',
}

const PERFORMANCE_LEVEL_COLORS: Record<number, string> = {
  7: 'bg-green-100 text-green-800',
  6: 'bg-teal-100 text-teal-800',
  5: 'bg-blue-100 text-blue-800',
  4: 'bg-yellow-100 text-yellow-800',
  3: 'bg-orange-100 text-orange-800',
  2: 'bg-red-100 text-red-700',
  1: 'bg-red-200 text-red-900',
}

function getLevel(pct: number) {
  if (pct >= 80) return 7
  if (pct >= 70) return 6
  if (pct >= 60) return 5
  if (pct >= 50) return 4
  if (pct >= 40) return 3
  if (pct >= 30) return 2
  return 1
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({
  poaId,
  usedWeight,
  onClose,
}: {
  poaId:       string
  usedWeight:  number
  onClose:     () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    title:       '',
    taskType:    'CLASS_TEST' as TaskType,
    maxMark:     100,
    weightInSba: Math.max(0, 100 - usedWeight),
    isExam:      false,
    dueDate:     '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      assessmentApi.createTask({
        programmeOfAssessmentId: poaId,
        ...form,
        dueDate: form.dueDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markbook', poaId] })
      queryClient.invalidateQueries({ queryKey: ['poas'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to add task'),
  })

  const remaining = 100 - usedWeight
  const canSubmit = form.title.trim() && form.maxMark > 0 && form.weightInSba > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Assessment Task</h3>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Test 1: Algebra"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={form.taskType}
                onChange={(e) => setForm((f) => ({ ...f, taskType: e.target.value as TaskType, isExam: e.target.value === 'SUMMATIVE_EXAM' }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Mark</label>
              <input
                type="number"
                min={1}
                max={400}
                value={form.maxMark}
                onChange={(e) => setForm((f) => ({ ...f, maxMark: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              SBA Weight (%)
              <span className="ml-2 font-normal text-gray-400">
                {remaining}% remaining of 100%
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={remaining}
              value={form.weightInSba}
              onChange={(e) => setForm((f) => ({ ...f, weightInSba: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date (optional)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isExam}
              onChange={(e) => setForm((f) => ({ ...f, isExam: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700">
              This is a formal exam (excluded from SBA weighting)
            </span>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg"
          >
            {mutation.isPending ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline mark cell ─────────────────────────────────────────────────────────

type CellState = {
  rawMark:    number | null
  isAbsent:   boolean
  isExempted: boolean
}

function MarkCell({
  taskId,
  maxMark,
  learnerId,
  initial,
  onSave,
  disabled,
}: {
  taskId:    string
  maxMark:   number
  learnerId: string
  initial:   CellState
  onSave:    (taskId: string, learnerId: string, state: CellState) => void
  disabled:  boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CellState>(initial)

  const pct = initial.rawMark != null ? (initial.rawMark / maxMark) * 100 : null

  if (initial.isExempted) {
    return (
      <td className="px-2 py-1.5 text-center">
        <span className="text-xs text-gray-400 italic">Exc</span>
      </td>
    )
  }

  if (initial.isAbsent) {
    return (
      <td
        className="px-2 py-1.5 text-center cursor-pointer hover:bg-gray-50"
        onClick={() => !disabled && setEditing(true)}
      >
        <span className="text-xs text-red-500 font-medium">Abs</span>
      </td>
    )
  }

  if (editing) {
    return (
      <td className="px-1 py-1">
        <div className="flex items-center gap-1">
          <input
            type="number"
            autoFocus
            min={0}
            max={maxMark}
            value={draft.rawMark ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, rawMark: e.target.value === '' ? null : Number(e.target.value) }))
            }
            className="w-14 text-xs rounded border border-primary-400 px-1 py-0.5 text-center focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave(taskId, learnerId, draft)
                setEditing(false)
              }
              if (e.key === 'Escape') {
                setDraft(initial)
                setEditing(false)
              }
            }}
          />
          <button
            onClick={() => { onSave(taskId, learnerId, draft); setEditing(false) }}
            className="p-0.5 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setDraft(initial); setEditing(false) }}
            className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    )
  }

  return (
    <td
      className="px-2 py-1.5 text-center cursor-pointer hover:bg-primary-50 group"
      onClick={() => !disabled && setEditing(true)}
    >
      {initial.rawMark !== null ? (
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-900">
            {initial.rawMark}
            <span className="text-xs text-gray-400">/{maxMark}</span>
          </span>
          {pct !== null && (
            <span className={`text-xs ${pct >= 40 ? 'text-gray-500' : 'text-red-500'}`}>
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-300 group-hover:text-primary-400">—</span>
      )}
    </td>
  )
}

// ─── SBA column cell ──────────────────────────────────────────────────────────
function SbaCell({ pct, isAtRisk }: { pct: number; isAtRisk: boolean }) {
  const level = getLevel(pct)
  return (
    <td className="px-2 py-1.5 text-center">
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${PERFORMANCE_LEVEL_COLORS[level]}`}>
          L{level}
        </span>
        <span className={`text-xs font-medium ${isAtRisk ? 'text-red-600' : 'text-gray-700'}`}>
          {pct.toFixed(1)}%
          {isAtRisk && <AlertTriangle className="inline h-3 w-3 ml-0.5 text-red-500" />}
        </span>
      </div>
    </td>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarkbookPage() {
  const { id: poaId } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [showAddTask, setShowAddTask] = useState(false)
  // Pending changes: taskId → learnerId → CellState
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, Map<string, CellState>>
  >(new Map())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Fetch markbook
  const { data: mb, isLoading, error } = useQuery({
    queryKey: ['markbook', poaId],
    queryFn:  () => assessmentApi.getMarkbook(poaId),
    refetchOnWindowFocus: false,
  })

  // Advance status mutation
  const statusMutation = useMutation({
    mutationFn: (status: PoaStatus) =>
      assessmentApi.updatePoaStatus(poaId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markbook', poaId] }),
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => assessmentApi.deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markbook', poaId] }),
  })

  // Collect a pending change
  const handleCellChange = useCallback(
    (taskId: string, learnerId: string, state: CellState) => {
      setPendingChanges((prev) => {
        const next = new Map(prev)
        if (!next.has(taskId)) next.set(taskId, new Map())
        next.get(taskId)!.set(learnerId, state)
        return next
      })
    },
    []
  )

  // Save all pending changes
  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return
    setSaving(true)
    setSaveError('')
    try {
      for (const [taskId, learnerMap] of pendingChanges.entries()) {
        const marks = Array.from(learnerMap.entries()).map(([learnerId, state]) => ({
          learnerId,
          rawMark:    state.rawMark ?? null,
          isAbsent:   state.isAbsent,
          isExempted: state.isExempted,
        }))
        await assessmentApi.captureMarks({ assessmentTaskId: taskId, marks })
      }
      setPendingChanges(new Map())
      queryClient.invalidateQueries({ queryKey: ['markbook', poaId] })
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const pendingCount = Array.from(pendingChanges.values())
    .reduce((n, m) => n + m.size, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-400">
        Loading markbook…
      </div>
    )
  }

  if (error || !mb) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-red-500">Failed to load markbook.</p>
        <button
          onClick={() => router.back()}
          className="mt-3 text-sm text-primary-600 underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const { poa, tasks, rows, taskAverages, sbaWeight, examWeight, atRiskCount } = mb
  const isApproved = poa.status === 'APPROVED'
  const usedWeight = tasks.reduce((s, t) => s + Number(t.weightInSba), 0)
  const nextStatus = POA_STATUS_NEXT[poa.status as PoaStatus]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/assessment')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {poa.subject?.name ?? 'Markbook'}
          </h1>
          <p className="text-sm text-gray-500">
            {poa.grade ? `Grade ${poa.grade.gradeNumber}` : ''}
            {poa.term ? ` · ${poa.term.name}` : ''}
            {' · '}
            <span className="font-medium">SBA {(sbaWeight * 100).toFixed(0)}%</span>
            {' / Exam '}
            <span className="font-medium">{(examWeight * 100).toFixed(0)}%</span>
          </p>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2">
          {/* POA status badge */}
          <span className={[
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            poa.status === 'APPROVED'  ? 'bg-green-100 text-green-700' :
            poa.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                         'bg-gray-100 text-gray-600',
          ].join(' ')}>
            {poa.status}
          </span>

          {nextStatus && !isApproved && (
            <button
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(nextStatus)}
              className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50"
            >
              {poa.status === 'DRAFT' ? 'Submit for Review' : 'Approve POA'}
            </button>
          )}

          {!isApproved && (
            <button
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Users className="h-4 w-4" />,      label: 'Learners',   value: rows.length,   color: 'text-gray-900' },
          { icon: <BookOpen className="h-4 w-4" />,   label: 'Tasks',      value: tasks.length,  color: 'text-gray-900' },
          { icon: <TrendingUp className="h-4 w-4" />, label: 'SBA Weight', value: `${usedWeight}%`, color: usedWeight === 100 ? 'text-green-600' : 'text-amber-600' },
          { icon: <AlertTriangle className="h-4 w-4" />, label: 'At Risk', value: atRiskCount,    color: atRiskCount > 0 ? 'text-red-600' : 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-card p-3 flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500">{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Weight bar */}
      <div className="bg-white rounded-xl shadow-card px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600">Task weight allocation</span>
          <span className={`text-xs font-semibold ${usedWeight === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            {usedWeight}/100%
          </span>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 bg-gray-100 gap-px">
          {tasks.map((t) => (
            <div
              key={t.id}
              title={`${t.title}: ${t.weightInSba}%`}
              style={{ width: `${t.weightInSba}%` }}
              className={`${t.isExam ? 'bg-purple-400' : 'bg-primary-500'} transition-all`}
            />
          ))}
        </div>
      </div>

      {/* Save bar */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Clock className="h-4 w-4" />
            {pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            <button
              onClick={() => { setPendingChanges(new Map()); setSaveError('') }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-amber-100 rounded-lg"
            >
              Discard
            </button>
            <button
              disabled={saving}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>
      )}

      {/* Markbook grid */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No learners enrolled in this class.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-12 text-center">
          <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No tasks added yet. Click "Add Task" to start.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {/* Learner name */}
                  <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-2.5 font-medium text-gray-600 min-w-[160px] border-r border-gray-100">
                    Learner
                  </th>
                  {/* Task columns */}
                  {tasks.map((task) => (
                    <th
                      key={task.id}
                      className="px-2 py-2.5 font-medium text-gray-600 text-center min-w-[90px]"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="truncate max-w-[80px] text-xs" title={task.title}>
                          {task.title}
                        </span>
                        <span className="text-xs text-gray-400 font-normal">
                          {TASK_TYPE_LABELS[task.taskType as TaskType]}
                          {' · '}
                          {task.weightInSba}%
                        </span>
                        <span className="text-xs text-gray-300 font-normal">/{task.maxMark}</span>
                        {!isApproved && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
                                deleteTaskMutation.mutate(task.id)
                              }
                            }}
                            className="mt-0.5 p-0.5 text-gray-300 hover:text-red-400 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {/* SBA column */}
                  <th className="px-2 py-2.5 font-medium text-gray-600 text-center min-w-[80px] border-l border-gray-100 bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="text-xs">SBA %</span>
                      <span className="text-xs text-gray-400 font-normal">Level</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row: MarkbookRow) => {
                  // Merge pending changes into display state
                  const displayMarks = { ...row.marks }
                  const taskChanges = pendingChanges
                  for (const [taskId, learnerMap] of taskChanges.entries()) {
                    if (learnerMap.has(row.learner.id)) {
                      displayMarks[taskId] = learnerMap.get(row.learner.id)!
                    }
                  }
                  return (
                    <tr
                      key={row.learner.id}
                      className={`hover:bg-gray-50 transition-colors ${row.isAtRisk ? 'bg-red-50/30' : ''}`}
                    >
                      {/* Name */}
                      <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {row.learner.lastName}, {row.learner.firstName}
                          </p>
                          {row.learner.admissionNumber && (
                            <p className="text-xs text-gray-400">{row.learner.admissionNumber}</p>
                          )}
                        </div>
                      </td>
                      {/* Mark cells */}
                      {tasks.map((task) => {
                        const cell = displayMarks[task.id] ?? {
                          rawMark: null, isAbsent: false, isExempted: false,
                        }
                        return (
                          <MarkCell
                            key={task.id}
                            taskId={task.id}
                            maxMark={Number(task.maxMark)}
                            learnerId={row.learner.id}
                            initial={cell}
                            onSave={handleCellChange}
                            disabled={isApproved}
                          />
                        )
                      })}
                      {/* SBA */}
                      <td className="px-2 py-1.5 border-l border-gray-100 bg-blue-50/30">
                        <SbaCell pct={row.sbaPercentage} isAtRisk={row.isAtRisk} />
                      </td>
                    </tr>
                  )
                })}

                {/* Class average row */}
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                  <td className="sticky left-0 bg-gray-50 px-4 py-2.5 text-xs text-gray-600 uppercase tracking-wide border-r border-gray-100">
                    Class Avg
                  </td>
                  {tasks.map((task) => {
                    const avg = taskAverages[task.id]
                    return (
                      <td key={task.id} className="px-2 py-2.5 text-center">
                        {avg !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-gray-800">
                              {avg.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-2 py-2.5 text-center border-l border-gray-100 bg-blue-50">
                    {rows.length > 0 ? (
                      <span className="text-sm font-semibold text-blue-700">
                        {(rows.reduce((s, r) => s + r.sbaPercentage, 0) / rows.length).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          poaId={poaId}
          usedWeight={usedWeight}
          onClose={() => setShowAddTask(false)}
        />
      )}
    </div>
  )
}
