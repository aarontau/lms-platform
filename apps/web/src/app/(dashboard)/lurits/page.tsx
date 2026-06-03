'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Download, CheckCircle2, AlertTriangle, AlertCircle,
  Clock, FileText, RefreshCw, ShieldCheck, Database,
  ChevronRight, Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { luritsApi, gradesApi, academicYearsApi } from '@/lib/api'
import type { LuritsExportType } from '@/lib/api'
import type { AcademicYear, LuritsExportBatch } from '@/types'

// ─── Export type config ───────────────────────────────────────────────────────
const EXPORT_TYPES: {
  type: LuritsExportType
  label: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  {
    type:        'LEARNER_DATA',
    label:       'Learner Biographical Data',
    description: 'Full learner register: names, DOB, gender, nationality, guardian details, enrolment. Required for SA-SAMS registration.',
    icon:        Database,
    color:       'border-blue-200 bg-blue-50 hover:border-blue-400',
  },
  {
    type:        'ATTENDANCE',
    label:       'Attendance Records',
    description: 'Daily attendance register for the selected academic year. Used for EMIS attendance reporting.',
    icon:        CheckCircle2,
    color:       'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
  },
  {
    type:        'MARKS',
    label:       'Assessment Marks',
    description: 'All captured assessment marks per learner per subject. Used for SA-SAMS mark submission.',
    icon:        FileText,
    color:       'border-violet-200 bg-violet-50 hover:border-violet-400',
  },
  {
    type:        'EMIS_ANNUAL',
    label:       'EMIS Annual Survey',
    description: 'Enrolment totals by grade and gender for the DBE Annual Survey submission.',
    icon:        ShieldCheck,
    color:       'border-amber-200 bg-amber-50 hover:border-amber-400',
  },
]

const STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  COMPLETE:   { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', label: 'Complete'   },
  PROCESSING: { icon: Clock,        color: 'text-amber-600  bg-amber-50',    label: 'Processing' },
  PENDING:    { icon: Clock,        color: 'text-gray-500   bg-gray-50',     label: 'Pending'    },
  FAILED:     { icon: AlertCircle,  color: 'text-red-600    bg-red-50',      label: 'Failed'     },
}

// ─── Validation result panel ──────────────────────────────────────────────────
function ValidationPanel({
  result, onProceed, onReset, loading,
}: {
  result: { valid: boolean; errors: string[]; warnings: string[]; summary: any } | null
  onProceed: () => void
  onReset: () => void
  loading: boolean
}) {
  if (!result) return null
  return (
    <div className={`rounded-xl border p-5 space-y-4 ${result.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-3">
        {result.valid
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          : <AlertCircle  className="h-5 w-5 text-red-600 flex-shrink-0" />
        }
        <div>
          <p className="font-semibold text-gray-900">
            {result.valid ? 'Data is ready to export' : 'Validation failed — fix errors before exporting'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {result.summary.learnerCount} active learners · {result.summary.academicYear} academic year
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <ul className="space-y-1.5">
          {result.errors.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {e}
            </li>
          ))}
        </ul>
      )}

      {result.warnings.length > 0 && (
        <ul className="space-y-1.5">
          {result.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
        >
          Change selection
        </button>
        {result.valid && (
          <button
            onClick={onProceed}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors shadow-sm"
          >
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Download className="h-4 w-4" /> Generate & Download CSV</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ─── History row ─────────────────────────────────────────────────────────────
function HistoryRow({ batch }: { batch: LuritsExportBatch }) {
  const s = STATUS_MAP[batch.status] ?? STATUS_MAP.PENDING
  const Icon = s.icon
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900">
        {batch.exportType.replace(/_/g, ' ')}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {batch.academicYear?.year ?? '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
          <Icon className="h-3 w-3" />
          {s.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">
        {batch.recordCount > 0 ? batch.recordCount.toLocaleString() : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {batch.exportedBy?.firstName} {batch.exportedBy?.lastName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {format(new Date(batch.createdAt), 'dd MMM yyyy HH:mm')}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LuritsPage() {
  const queryClient = useQueryClient()

  const [selectedType,    setSelectedType   ] = useState<LuritsExportType | null>(null)
  const [academicYearId,  setAcademicYearId ] = useState('')
  const [validationResult,setValidationResult] = useState<any>(null)
  const [exportSuccess,   setExportSuccess  ] = useState<{ filename: string; count: number } | null>(null)
  const [exportError,     setExportError    ] = useState<string>('')

  // Fetch history
  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: ['lurits-history'],
    queryFn:  () => luritsApi.listHistory(),
    staleTime: 30_000,
  })

  // Fetch academic years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 5 * 60_000,
  })

  // Auto-select the current academic year once data loads
  useEffect(() => {
    if (!academicYearId && (academicYears as AcademicYear[]).length > 0) {
      const current = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
      setAcademicYearId(current?.id ?? (academicYears as AcademicYear[])[0]?.id ?? '')
    }
  }, [academicYears, academicYearId])

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: () => luritsApi.validate(academicYearId, selectedType!),
    onSuccess:  (data) => setValidationResult(data),
    onError:    (e: any) => setExportError(e?.message ?? 'Validation failed'),
  })

  // Export handler
  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    if (!selectedType) return
    setExporting(true)
    setExportError('')
    try {
      const result = await luritsApi.export(academicYearId, selectedType)
      // Trigger browser download
      const url = URL.createObjectURL(result.blob)
      const a   = Object.assign(document.createElement('a'), { href: url, download: result.filename })
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportSuccess({ filename: result.filename, count: result.recordCount })
      setValidationResult(null)
      setSelectedType(null)
      queryClient.invalidateQueries({ queryKey: ['lurits-history'] })
    } catch (e: any) {
      setExportError(e?.message ?? 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleReset = () => {
    setSelectedType(null)
    setValidationResult(null)
    setExportError('')
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <span className="absolute right-4 bottom-1 text-[3.25rem] font-black text-white/10 leading-none select-none tracking-widest" aria-hidden="true">EMIS</span>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">LURITS / SA-SAMS Export</h1>
          <p className="text-sm text-teal-100 mt-0.5">
            One-click compliance data export compatible with SA-SAMS and LURITS requirements
          </p>
        </div>
      </div>

      {/* ── Success alert ─────────────────────────────────────────────────── */}
      {exportSuccess && (
        <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Export complete</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {exportSuccess.count.toLocaleString()} records exported · File: <span className="font-mono">{exportSuccess.filename}</span>
            </p>
          </div>
          <button onClick={() => setExportSuccess(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            ×
          </button>
        </div>
      )}

      {/* ── Error alert ───────────────────────────────────────────────────── */}
      {exportError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {exportError}
          <button onClick={() => setExportError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* ── Export builder ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Generate New Export</h2>
          </div>

          {/* Academic year selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Year:</label>
            <select
              value={academicYearId}
              onChange={(e) => { setAcademicYearId(e.target.value); handleReset() }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {(academicYears as AcademicYear[]).length === 0
                ? <option value="">Loading…</option>
                : (academicYears as AcademicYear[]).map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.year}</option>
                  ))
              }
            </select>
          </div>
        </div>

        <div className="p-5">
          {/* Step 1 — select type */}
          {!validationResult && (
            <>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                Select the export type, then validate to check data readiness before downloading.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {EXPORT_TYPES.map((et) => {
                  const Icon     = et.icon
                  const selected = selectedType === et.type
                  return (
                    <button
                      key={et.type}
                      onClick={() => { setSelectedType(et.type); setExportError('') }}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                        selected ? 'border-primary-500 bg-primary-50' : et.color
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-primary-600' : 'text-gray-600'}`} />
                        <p className="text-sm font-semibold text-gray-900">{et.label}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{et.description}</p>
                    </button>
                  )
                })}
              </div>

              <button
                disabled={!selectedType || validateMutation.isPending}
                onClick={() => { setExportError(''); validateMutation.mutate() }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              >
                {validateMutation.isPending
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Validating…</>
                  : <><ChevronRight className="h-4 w-4" /> Validate Data</>
                }
              </button>
            </>
          )}

          {/* Step 2 — show validation result */}
          <ValidationPanel
            result={validationResult}
            onProceed={handleExport}
            onReset={handleReset}
            loading={exporting}
          />
        </div>
      </div>

      {/* ── Export history ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <Clock className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Export History</h2>
          {histLoading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin ml-auto" />}
        </div>

        {history.length === 0 && !histLoading ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No exports yet — generate your first export above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Export Type','Year','Status','Records','Exported by','Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((batch) => (
                  <HistoryRow key={batch.id} batch={batch} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Help box ─────────────────────────────────────────────────────── */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teal-700 space-y-1">
          <p className="font-semibold">How to import into SA-SAMS</p>
          <p>1. Download the <strong>Learner Biographical Data</strong> export first.</p>
          <p>2. Open SA-SAMS → Learner Module → Import → Select the downloaded CSV.</p>
          <p>3. Map columns using the LURITS_NUMBER field as the unique identifier.</p>
          <p>4. For first-time registrations, learners without LURITS numbers will be assigned one by DBE on import.</p>
        </div>
      </div>
    </div>
  )
}
