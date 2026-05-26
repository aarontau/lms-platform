'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle, Upload, Download, Search, X,
  ChevronLeft, ChevronRight, AlertCircle, GraduationCap,
} from 'lucide-react'
import { learnersApi, gradesApi } from '@/lib/api'
import { LearnerTable } from '@/components/learners/LearnerTable'
import type { LearnerStatus } from '@/types'

// ─── Status filter options ────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: LearnerStatus | ''; label: string }[] = [
  { value: '',               label: 'All Statuses'    },
  { value: 'ACTIVE',         label: 'Active'          },
  { value: 'INACTIVE',       label: 'Inactive'        },
  { value: 'TRANSFERRED_OUT',label: 'Transferred Out' },
  { value: 'GRADUATED',      label: 'Graduated'       },
  { value: 'SUSPENDED',      label: 'Suspended'       },
]

// ─── CSV template download ────────────────────────────────────────────────────
function downloadTemplate() {
  const header  = 'firstName,middleName,lastName,dateOfBirth,gender,nationality,homeLanguage,idNumber,idType,admissionDate,admissionNumber,previousSchool,hasSpecialNeeds,medicalNotes,gradeId,classId'
  const example = 'Sipho,,Dlamini,2012-03-15,MALE,South African,Zulu,,SA_ID,2024-01-15,,,,false,<grade-uuid>,<class-uuid>'
  const blob    = new Blob([[header, example].join('\n')], { type: 'text/csv' })
  const url     = URL.createObjectURL(blob)
  const a       = Object.assign(document.createElement('a'), { href: url, download: 'learner_import_template.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LearnersPage() {
  const router       = useRouter()
  const queryClient  = useQueryClient()

  const [search,  setSearch ] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [status,  setStatus ] = useState<LearnerStatus | ''>('')
  const [page,    setPage   ] = useState(1)

  const hasFilters = !!(search || gradeId || status)

  // Fetch grades for filter dropdown (graceful failure if API not yet live)
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
    staleTime: 5 * 60_000,
  })

  // Fetch learners
  const { data, isLoading, isError } = useQuery({
    queryKey: ['learners', { search, gradeId, status, page }],
    queryFn:  () =>
      learnersApi.getAll({
        search:  search  || undefined,
        gradeId: gradeId || undefined,
        status:  (status || undefined) as LearnerStatus | undefined,
        page,
        limit: 20,
      }),
    placeholderData: (prev: any) => prev,
  })

  // Bulk deactivate
  const deactivateMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => learnersApi.deactivate(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learners'] })
    },
  })

  const learners   = data?.data ?? []
  const meta       = data?.meta

  const clearFilters = () => {
    setSearch(''); setGradeId(''); setStatus(''); setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 via-violet-600 to-violet-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
        <GraduationCap className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Learners</h1>
            <p className="text-sm text-violet-200 mt-0.5">
              {meta
                ? `${meta.total} learner${meta.total !== 1 ? 's' : ''} registered`
                : 'Manage learner registrations'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-100 bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Template
            </button>
            <button
              onClick={() => router.push('/learners/bulk-import')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-100 bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Bulk Import
            </button>
            <button
              onClick={() => router.push('/learners/register')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-violet-700 bg-white rounded-lg hover:bg-violet-50 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Register Learner
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search name or student number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Grade filter */}
        <select
          value={gradeId}
          onChange={(e) => { setGradeId(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
        >
          <option value="">All Grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as LearnerStatus | ''); setPage(1) }}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Failed to load learners. Please refresh or try again.
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <LearnerTable
        learners={learners}
        loading={isLoading}
        onDeactivate={(ids) => deactivateMutation.mutate(ids)}
      />

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between py-1">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-medium text-gray-700">{meta.total}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700 tabular-nums">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
