'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, Plus, Trash2, UserCheck, ChevronDown,
  CheckCircle2, XCircle, AlertCircle, Search,
} from 'lucide-react'
import { subjectsApi, gradesApi, usersApi } from '@/lib/api'
import type { SubjectClass, SchoolSubject, User } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SUBJECT_GROUPS = ['Language', 'Mathematics', 'Sciences', 'Social Sciences',
  'Technology', 'Arts', 'Economic & Management', 'Life Orientation', 'Other']

const GROUP_COLORS: Record<string, string> = {
  Language:                   'bg-blue-100 text-blue-700',
  Mathematics:                'bg-purple-100 text-purple-700',
  Sciences:                   'bg-green-100 text-green-700',
  'Social Sciences':          'bg-yellow-100 text-yellow-700',
  Technology:                 'bg-orange-100 text-orange-700',
  Arts:                       'bg-pink-100 text-pink-700',
  'Economic & Management':    'bg-emerald-100 text-emerald-700',
  'Life Orientation':         'bg-cyan-100 text-cyan-700',
}

function groupBadge(group: string) {
  const cls = GROUP_COLORS[group] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{group}</span>
}

// ─── Add Subject Class Modal ──────────────────────────────────────────────────
function AddSubjectClassModal({
  onClose, subjects, teachers, classes, academicYearId,
}: {
  onClose: () => void
  subjects: SchoolSubject[]
  teachers: User[]
  classes: Array<{ id: string; name: string; grade?: { gradeNumber: number; name: string } }>
  academicYearId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ schoolSubjectId: '', classId: '', teacherId: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => subjectsApi.createSubjectClass({ ...form, academicYearId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-classes'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to assign subject'),
  })

  const canSubmit = form.schoolSubjectId && form.classId && form.teacherId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Subject to Class</h3>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
            <select
              value={form.schoolSubjectId}
              onChange={(e) => setForm((f) => ({ ...f, schoolSubjectId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select subject…</option>
              {subjects.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.grade ? `Grade ${c.grade.gradeNumber} — ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
            <select
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>
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
            {mutation.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab]               = useState<'catalogue' | 'classes'>('classes')
  const [search, setSearch]         = useState('')
  const [showAddModal, setShowModal] = useState(false)

  // Data
  const { data: schoolSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['school-subjects'],
    queryFn: subjectsApi.getSchoolSubjects,
  })
  const { data: subjectClasses = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['subject-classes'],
    queryFn:  () => subjectsApi.getSubjectClasses(),
  })
  const { data: capsSubjects = [] } = useQuery({
    queryKey: ['caps-subjects'],
    queryFn:  subjectsApi.getCapsSubjects,
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['users', 'TEACHER'],
    queryFn:  () => usersApi.getAll({ role: 'TEACHER' as any }),
  })
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  gradesApi.getAll,
  })

  // All classes from all grades
  const allClasses = grades.flatMap((g: any) =>
    (g.classes ?? []).map((c: any) => ({ ...c, grade: g }))
  )

  // Mutations
  const deleteScMutation = useMutation({
    mutationFn: (id: string) => subjectsApi.deleteSubjectClass(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['subject-classes'] }),
  })

  // Filtered subject classes
  const filteredClasses = subjectClasses.filter((sc: SubjectClass) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      sc.schoolSubject?.name.toLowerCase().includes(q) ||
      sc.class?.name.toLowerCase().includes(q) ||
      sc.teacher?.firstName.toLowerCase().includes(q) ||
      sc.teacher?.lastName.toLowerCase().includes(q)
    )
  })

  // Group subject classes by grade
  const byGrade = filteredClasses.reduce((acc: Record<string, SubjectClass[]>, sc: SubjectClass) => {
    const key = sc.class?.grade
      ? `Grade ${sc.class.grade.gradeNumber} — ${sc.class.grade.name}`
      : 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(sc)
    return acc
  }, {})

  const tabs = [
    { key: 'classes',   label: 'Subject Classes', count: subjectClasses.length },
    { key: 'catalogue', label: 'CAPS Catalogue',  count: capsSubjects.length },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <BookOpen className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Subjects &amp; Classes</h1>
            <p className="text-sm text-primary-200 mt-0.5">
              Manage CAPS subject assignments per class and teacher
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-700 bg-white rounded-lg hover:bg-primary-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Assign Subject
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t.label}
              <span className={[
                'ml-2 rounded-full px-2 py-0.5 text-xs',
                tab === t.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {t.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Subject Classes Tab ── */}
      {tab === 'classes' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects, classes, teachers…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {loadingClasses ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading subject classes…</div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No subject classes assigned yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click "Assign Subject" to link a subject to a class and teacher.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(byGrade).sort().map(([grade, scs]) => (
                <div key={grade}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{grade}</h3>
                  <div className="bg-white rounded-xl shadow-card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Subject</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Class</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Teacher</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Group</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(scs as SubjectClass[]).map((sc) => (
                          <tr key={sc.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">{sc.schoolSubject?.name}</span>
                              <span className="ml-2 text-xs text-gray-400">{sc.schoolSubject?.code}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{sc.class?.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-700">
                                  {sc.teacher?.firstName} {sc.teacher?.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {groupBadge(sc.schoolSubject?.capsSubject?.subjectGroup ?? 'Other')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => deleteScMutation.mutate(sc.id)}
                                disabled={deleteScMutation.isPending}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAPS Catalogue Tab ── */}
      {tab === 'catalogue' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capsSubjects.map((cs: any) => (
            <div key={cs.id} className="bg-white rounded-xl shadow-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cs.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cs.code}</p>
                </div>
                {cs.isCompulsory ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Compulsory</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {groupBadge(cs.subjectGroup)}
                <span className="text-xs text-gray-400">
                  Gr {cs.capsPhase?.gradeFrom}–{cs.capsPhase?.gradeTo}
                </span>
              </div>
            </div>
          ))}
          {capsSubjects.length === 0 && (
            <p className="col-span-3 text-sm text-gray-400 text-center py-8">
              Loading CAPS catalogue…
            </p>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddSubjectClassModal
          onClose={() => setShowModal(false)}
          subjects={schoolSubjects}
          teachers={teachers as User[]}
          classes={allClasses}
          academicYearId=""
        />
      )}
    </div>
  )
}
