'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, Download, ChevronLeft, AlertCircle, CheckCircle2,
  RefreshCw, FileText, X, Info, Users,
} from 'lucide-react'
import { learnersApi } from '@/lib/api'
import type { IdType } from '@/types'

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { headers, rows }
}

function csvRowToDto(row: Record<string, string>) {
  return {
    firstName:       row.firstName,
    middleName:      row.middleName || undefined,
    lastName:        row.lastName,
    dateOfBirth:     row.dateOfBirth,
    gender:          row.gender as 'MALE' | 'FEMALE' | 'OTHER',
    nationality:     row.nationality || 'South African',
    homeLanguage:    row.homeLanguage || 'English',
    idNumber:        row.idNumber || undefined,
    idType:          (row.idType || undefined) as IdType | undefined,
    admissionDate:   row.admissionDate,
    admissionNumber: row.admissionNumber || undefined,
    previousSchool:  row.previousSchool || undefined,
    hasSpecialNeeds: row.hasSpecialNeeds === 'true' || row.hasSpecialNeeds === '1',
    medicalNotes:    row.medicalNotes || undefined,
    gradeId:         row.gradeId || undefined,
    classId:         row.classId || undefined,
  }
}

// ─── Template download ────────────────────────────────────────────────────────
function downloadTemplate() {
  const header = 'firstName,middleName,lastName,dateOfBirth,gender,nationality,homeLanguage,idNumber,idType,admissionDate,admissionNumber,previousSchool,hasSpecialNeeds,medicalNotes,gradeId,classId'
  const rows = [
    'Sipho,,Dlamini,2012-03-15,MALE,South African,Zulu,,SA_ID,2024-01-15,,,,false,,',
    'Naledi,Grace,Mokoena,2011-07-22,FEMALE,South African,Sotho,,SA_ID,2024-01-15,,,,false,,',
  ]
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'learner_import_template.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BulkImportPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [parsed, setParsed]   = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [filename, setFilename] = useState('')
  const [result,   setResult  ] = useState<{ success: number; failed: number; errors: any[] } | null>(null)
  const [parseErr, setParseErr] = useState('')

  const importMutation = useMutation({
    mutationFn: (dtos: any[]) => learnersApi.bulkImport(dtos),
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['learners'] })
    },
  })

  const handleFile = (file: File) => {
    setParseErr('')
    setResult(null)
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const p = parseCsv(text)
        if (p.rows.length === 0) {
          setParseErr('No data rows found in the CSV file. Check the format.')
          return
        }
        setParsed(p)
      } catch (err) {
        setParseErr('Could not parse CSV file. Ensure it uses commas as delimiters.')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) handleFile(file)
  }

  const handleImport = () => {
    if (!parsed) return
    const dtos = parsed.rows.map(csvRowToDto)
    importMutation.mutate(dtos)
  }

  const reset = () => {
    setParsed(null)
    setFilename('')
    setResult(null)
    setParseErr('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/learners')}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to Learners"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Import Learners</h1>
          <p className="text-sm text-gray-500">Upload a CSV to register multiple learners at once</p>
        </div>
      </div>

      {/* ── Result panel ─────────────────────────────────────────── */}
      {result && (
        <div className={`rounded-xl border p-5 ${result.failed === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.failed === 0
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              : <AlertCircle className="h-5 w-5 text-amber-600" />
            }
            <p className="font-semibold text-gray-900">
              Import complete — {result.success} succeeded, {result.failed} failed
            </p>
          </div>
          {result.errors.length > 0 && (
            <ul className="space-y-1 mt-2 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  Row {e.row}: {e.error}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={() => router.push('/learners')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
              <Users className="h-4 w-4" /> View Learners
            </button>
            <button onClick={reset} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Import another file
            </button>
          </div>
        </div>
      )}

      {/* ── Download template ─────────────────────────────────────── */}
      {!result && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Before uploading</p>
            <p>Download the template below and fill it in. Required fields: firstName, lastName, dateOfBirth, gender, admissionDate.</p>
            <p>For gradeId and classId, use the UUIDs from the Grades section.</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" /> Template
          </button>
        </div>
      )}

      {/* ── File drop zone ────────────────────────────────────────── */}
      {!result && !parsed && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50/30"
        >
          <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Drop your CSV file here, or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">CSV files only (.csv) · Maximum 500 learners per import</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {parseErr && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{parseErr}
        </div>
      )}

      {/* ── Preview table ─────────────────────────────────────────── */}
      {!result && parsed && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Preview — {filename}</h2>
              <span className="text-xs text-gray-500">({parsed.rows.length} learner{parsed.rows.length !== 1 ? 's' : ''})</span>
            </div>
            <button onClick={reset} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  {['#', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Admission Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsed.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-400 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.firstName}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.lastName}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 tabular-nums">{row.dateOfBirth}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{row.gender}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 tabular-nums">{row.admissionDate}</td>
                  </tr>
                ))}
                {parsed.rows.length > 50 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-xs text-gray-400 text-center">
                      … and {parsed.rows.length - 50} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {parsed.rows.length} learner{parsed.rows.length !== 1 ? 's' : ''} ready to import
            </p>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {importMutation.isPending
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Importing…</>
                : <><Upload className="h-4 w-4" /> Import {parsed.rows.length} Learners</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
