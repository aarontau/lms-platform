'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, Trash2, Clock, AlertCircle, Building2 } from 'lucide-react'
import { timetableApi, gradesApi, subjectsApi } from '@/lib/api'
import type { Period, TimetableSlot, Venue } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const VENUE_TYPES = ['CLASSROOM', 'LABORATORY', 'COMPUTER_LAB', 'HALL', 'SPORTS_FIELD', 'OTHER']

// ─── Add Slot Modal ───────────────────────────────────────────────────────────
function AddSlotModal({
  period, onClose, venues, subjectClasses, academicYearId,
}: {
  period: Period
  onClose: () => void
  venues: Venue[]
  subjectClasses: any[]
  academicYearId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ subjectClassId: '', venueId: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => timetableApi.createSlot({
      periodId:       period.id,
      subjectClassId: form.subjectClassId,
      venueId:        form.venueId,
      academicYearId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-slots'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to create slot'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Assign Slot</h3>
        <p className="text-sm text-gray-500 mb-4">
          {DAYS[period.dayOfWeek - 1]} · {period.name} · {period.startTime}–{period.endTime}
        </p>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject Class</label>
            <select
              value={form.subjectClassId}
              onChange={(e) => setForm((f) => ({ ...f, subjectClassId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select subject class…</option>
              {subjectClasses.map((sc: any) => (
                <option key={sc.id} value={sc.id}>
                  {sc.class?.grade ? `Gr${sc.class.grade.gradeNumber} ` : ''}
                  {sc.class?.name} — {sc.schoolSubject?.name}
                  {' '}({sc.teacher?.firstName} {sc.teacher?.lastName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
            <select
              value={form.venueId}
              onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name} (cap. {v.capacity})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            disabled={!form.subjectClassId || !form.venueId || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg"
          >
            {mutation.isPending ? 'Saving…' : 'Assign Slot'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Period Modal ─────────────────────────────────────────────────────────
function AddPeriodModal({
  onClose, academicYearId, existingCount,
}: {
  onClose: () => void
  academicYearId: string
  existingCount: number
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: `Period ${existingCount + 1}`,
    periodNumber: existingCount + 1,
    startTime: '08:00',
    endTime: '08:45',
    dayOfWeek: 1,
    isLesson: true,
  })

  const mutation = useMutation({
    mutationFn: () => timetableApi.createPeriod({ ...form, academicYearId }),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['periods'] }); onClose() },
    onError:    (e: any) => setError(e?.response?.data?.message ?? 'Failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Period</h3>
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
              <input type="time" value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
              <input type="time" value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isLesson}
              onChange={(e) => setForm((f) => ({ ...f, isLesson: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">Teaching period (not a break)</span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg"
          >
            {mutation.isPending ? 'Adding…' : 'Add Period'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const queryClient = useQueryClient()
  const [tab, setTab]                 = useState<'builder' | 'periods' | 'venues'>('builder')
  const [selectedClassId, setClassId] = useState('')
  const [addPeriodOpen, setPeriodOpen] = useState(false)
  const [addSlot, setAddSlot]         = useState<Period | null>(null)

  // Hardcoded for now — in production this comes from the session's current academic year
  const academicYearId = ''

  const { data: periods = [], isLoading: loadingPeriods } = useQuery({
    queryKey: ['periods'],
    queryFn:  () => timetableApi.getPeriods(academicYearId || undefined),
  })
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['timetable-slots'],
    queryFn:  () => timetableApi.getSlots(academicYearId || undefined),
  })
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn:  timetableApi.getVenues,
  })
  const { data: subjectClasses = [] } = useQuery({
    queryKey: ['subject-classes'],
    queryFn:  () => subjectsApi.getSubjectClasses(),
  })
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  gradesApi.getAll,
  })

  const allClasses = (grades as any[]).flatMap((g: any) =>
    (g.classes ?? []).map((c: any) => ({ ...c, grade: g }))
  )

  const deleteSlot = useMutation({
    mutationFn: (id: string) => timetableApi.deleteSlot(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['timetable-slots'] }),
  })

  // Build timetable grid: dayOfWeek → periodNumber → slot
  const slotGrid = useMemo(() => {
    const grid: Record<number, Record<number, TimetableSlot[]>> = {}
    const filtered = selectedClassId
      ? (slots as TimetableSlot[]).filter((s) => s.subjectClass?.class?.id === selectedClassId)
      : (slots as TimetableSlot[])
    for (const slot of filtered) {
      if (!slot.period) continue
      const day = slot.period.dayOfWeek
      const pn  = slot.period.periodNumber
      if (!grid[day]) grid[day] = {}
      if (!grid[day][pn]) grid[day][pn] = []
      grid[day][pn].push(slot)
    }
    return grid
  }, [slots, selectedClassId])

  // Unique period numbers across all days
  const periodNums = useMemo(() => {
    const nums = new Set<number>()
    ;(periods as Period[]).filter((p) => p.isLesson).forEach((p) => nums.add(p.periodNumber))
    return Array.from(nums).sort()
  }, [periods])

  // Period lookup
  const periodsByDayNum = useMemo(() => {
    const map: Record<string, Period> = {}
    for (const p of periods as Period[]) map[`${p.dayOfWeek}-${p.periodNumber}`] = p
    return map
  }, [periods])

  const tabs = [
    { key: 'builder', label: 'Timetable Grid' },
    { key: 'periods', label: 'Period Config' },
    { key: 'venues',  label: 'Venues' },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <Calendar className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Timetable</h1>
            <p className="text-sm text-amber-100 mt-0.5">Build and manage the school timetable</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {tab === 'builder' && (
              <button onClick={() => setAddSlot({ id: '', schoolId: '', academicYearId: '', name: 'New', periodNumber: 1, startTime: '', endTime: '', dayOfWeek: 1, isLesson: true })}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-white rounded-lg hover:bg-amber-50 transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Add Slot
              </button>
            )}
            {tab === 'periods' && (
              <button onClick={() => setPeriodOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-white rounded-lg hover:bg-amber-50 transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Add Period
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'].join(' ')}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Timetable Grid Tab ── */}
      {tab === 'builder' && (
        <div className="space-y-4">
          {/* Class filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Filter by class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All classes</option>
              {allClasses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  Gr{c.grade?.gradeNumber} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {periods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No periods configured yet.</p>
              <button onClick={() => setTab('periods')} className="mt-2 text-sm text-primary-600 hover:underline">
                Go to Period Config →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow-card">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 w-24">
                      Period
                    </th>
                    {DAYS.map((day, i) => (
                      <th key={i} className="border border-gray-200 bg-gray-50 px-3 py-2 text-center font-medium text-gray-600">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{DAY_SHORT[i]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodNums.map((pn) => (
                    <tr key={pn}>
                      <td className="border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="font-medium text-gray-700 text-xs">P{pn}</div>
                        {periodsByDayNum[`1-${pn}`] && (
                          <div className="text-xs text-gray-400">
                            {periodsByDayNum[`1-${pn}`].startTime}
                          </div>
                        )}
                      </td>
                      {[1, 2, 3, 4, 5].map((day) => {
                        const cellSlots = slotGrid[day]?.[pn] ?? []
                        const cellPeriod = periodsByDayNum[`${day}-${pn}`]
                        return (
                          <td key={day}
                            className="border border-gray-200 px-2 py-1.5 min-w-[120px] align-top">
                            {cellSlots.length === 0 ? (
                              <button
                                onClick={() => cellPeriod && setAddSlot(cellPeriod)}
                                disabled={!cellPeriod}
                                className="w-full h-12 flex items-center justify-center text-gray-300 hover:text-primary-400 hover:bg-primary-50 rounded-lg transition-colors disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="space-y-1">
                                {cellSlots.map((slot) => (
                                  <div key={slot.id}
                                    className="rounded-lg bg-primary-50 border border-primary-200 px-2 py-1.5 group relative">
                                    <p className="text-xs font-medium text-primary-800 leading-tight">
                                      {slot.subjectClass?.schoolSubject?.name}
                                    </p>
                                    <p className="text-xs text-primary-600">
                                      {slot.subjectClass?.class?.name}
                                    </p>
                                    <p className="text-xs text-primary-500">
                                      {slot.subjectClass?.teacher?.firstName} {slot.subjectClass?.teacher?.lastName}
                                    </p>
                                    <button
                                      onClick={() => deleteSlot.mutate(slot.id)}
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-primary-400 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Periods Tab ── */}
      {tab === 'periods' && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {periods.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No periods yet. Click "Add Period" to configure your school day.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Day', 'Period', 'Label', 'Time', 'Type'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(periods as Period[]).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{DAYS[p.dayOfWeek - 1]}</td>
                    <td className="px-4 py-3 text-gray-500">P{p.periodNumber}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <Clock className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                      {p.startTime} – {p.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.isLesson ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.isLesson ? 'Lesson' : 'Break'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Venues Tab ── */}
      {tab === 'venues' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(venues as Venue[]).map((v) => (
            <div key={v.id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.venueType.replace('_', ' ')} · cap. {v.capacity}</p>
                </div>
              </div>
            </div>
          ))}
          {venues.length === 0 && (
            <p className="col-span-3 text-sm text-gray-400 text-center py-8">
              No venues configured. Add classrooms and labs in your school setup.
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      {addPeriodOpen && (
        <AddPeriodModal
          onClose={() => setPeriodOpen(false)}
          academicYearId={academicYearId}
          existingCount={(periods as Period[]).length}
        />
      )}
      {addSlot && (
        <AddSlotModal
          period={addSlot}
          onClose={() => setAddSlot(null)}
          venues={venues as Venue[]}
          subjectClasses={subjectClasses as any[]}
          academicYearId={academicYearId}
        />
      )}
    </div>
  )
}
