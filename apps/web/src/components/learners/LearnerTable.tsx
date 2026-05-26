'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Download } from 'lucide-react'
import type { Learner } from '@/types'

type SortField  = 'studentNumber' | 'lastName' | 'grade' | 'homeLanguage' | 'status'
type SortDir    = 'asc' | 'desc'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:          'bg-green-100 text-green-700',
  INACTIVE:        'bg-gray-100 text-gray-600',
  TRANSFERRED_OUT: 'bg-yellow-100 text-yellow-700',
  GRADUATED:       'bg-blue-100 text-blue-700',
  SUSPENDED:       'bg-red-100 text-red-700',
}

function SortIcon({ field, sort }: { field: SortField; sort: { field: SortField; dir: SortDir } | null }) {
  if (!sort || sort.field !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  return sort.dir === 'asc'
    ? <ChevronUp   className="h-3.5 w-3.5 text-primary-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
}

interface LearnerTableProps {
  learners:  Learner[]
  loading?:  boolean
  onDeactivate?: (ids: string[]) => void
}

export const LearnerTable: React.FC<LearnerTableProps> = ({ learners, loading, onDeactivate }) => {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir } | null>(null)

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev?.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' },
    )
  }

  const sorted = [...learners].sort((a, b) => {
    if (!sort) return 0
    let av = '', bv = ''
    switch (sort.field) {
      case 'studentNumber': av = a.studentNumber; bv = b.studentNumber; break
      case 'lastName':      av = a.lastName;      bv = b.lastName;      break
      case 'homeLanguage':  av = a.homeLanguage;  bv = b.homeLanguage;  break
      case 'status':        av = a.status;        bv = b.status;        break
      case 'grade':
        av = String(a.currentEnrolment?.grade?.gradeNumber ?? 0)
        bv = String(b.currentEnrolment?.grade?.gradeNumber ?? 0)
        break
    }
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const allSelected = learners.length > 0 && selected.size === learners.length
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(learners.map(l => l.id)))
  const toggleOne   = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const exportCSV = () => {
    const ids    = selected.size > 0 ? [...selected] : learners.map(l => l.id)
    const subset = learners.filter(l => ids.includes(l.id))
    const header = 'Student Number,First Name,Last Name,Grade,Class,Home Language,Status'
    const rows   = subset.map(l =>
      [
        l.studentNumber,
        l.firstName,
        l.lastName,
        l.currentEnrolment?.grade?.name ?? '',
        l.currentEnrolment?.class?.name ?? '',
        l.homeLanguage,
        l.status,
      ].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'learners.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label} <SortIcon field={field} sort={sort} />
      </span>
    </th>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="px-4 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
          <span className="text-sm font-medium text-primary-700">{selected.size} selected</span>
          <button
            onClick={() => { onDeactivate?.([...selected]); setSelected(new Set()) }}
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Deactivate
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all learners"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <Th field="studentNumber" label="Student No." />
              <Th field="lastName"      label="Full Name"    />
              <Th field="grade"         label="Grade"        />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
              <Th field="homeLanguage"  label="Home Language" />
              <Th field="status"        label="Status"       />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  No learners found.
                </td>
              </tr>
            ) : sorted.map((learner) => (
              <tr
                key={learner.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/learners/${learner.id}`)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(learner.id)}
                    onChange={() => toggleOne(learner.id)}
                    aria-label={`Select ${learner.firstName} ${learner.lastName}`}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{learner.studentNumber}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{learner.lastName}, {learner.firstName}</p>
                  {learner.middleName && <p className="text-xs text-gray-400">{learner.middleName}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {learner.currentEnrolment?.grade?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {learner.currentEnrolment?.class?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{learner.homeLanguage}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[learner.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {learner.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/learners/${learner.id}`)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LearnerTable
