'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gradesApi, learnersApi } from '@/lib/api'
import { format } from 'date-fns'
import {
  Printer, ChevronDown, Users, GraduationCap, School,
  BookOpen, AlertCircle, Loader2,
} from 'lucide-react'
import { SchoolSeal } from '@/components/ui/SchoolSeal'
import type { Grade, Learner } from '@/types'

// ─── Center definitions ────────────────────────────────────────────────────
const CENTERS = [
  { key: 'BuPhe',    label: 'BuPhe Center',  subtitle: 'Burgersdorp & Pherehla-Maake', prefix: 'BuPhe-'    },
  { key: 'MaPhu',    label: 'MaPhu Center',  subtitle: 'Mafutsane & Phusela',          prefix: 'MaPhu-'    },
  { key: 'Kgapane',  label: 'Kgapane Center', subtitle: 'Kgapane',                    prefix: 'Kgapane-'  },
]

function getCenterForClass(className: string) {
  for (const c of CENTERS) {
    if (className.startsWith(c.prefix)) return c
  }
  return null
}

// ─── Print area component ──────────────────────────────────────────────────
interface PrintListProps {
  schoolName:  string
  centerLabel: string
  gradeName:   string
  className:   string
  learners:    Learner[]
  printDate:   string
}

const PrintList = React.forwardRef<HTMLDivElement, PrintListProps>(
  ({ schoolName, centerLabel, gradeName, className, learners, printDate }, ref) => {
    const sorted = [...learners].sort((a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    )

    return (
      <div ref={ref} className="classlist-print-area bg-white p-8 min-h-screen">
        {/* ── School / class header ──────────────────────────────────────── */}
        <div className="border-b-2 border-gray-800 pb-5 mb-6">

          {/* Seal + title row */}
          <div className="flex items-center gap-6 mb-5">
            {/* Seal rendered in dark variant so text is navy/indigo on white paper */}
            <SchoolSeal
              size={140}
              topLabel="UL-Junior Project"
              bottomLabel={schoolName}
              variant="dark"
            />

            <div className="flex-1">
              <h1 className="text-2xl font-black text-amber-700 uppercase tracking-widest leading-tight">
                UL-Junior Project
              </h1>
              <p className="text-base font-bold text-gray-900 uppercase tracking-wide mt-1">
                {schoolName}
              </p>
              <p className="text-xs text-gray-400 mt-3">Printed: {printDate}</p>
            </div>
          </div>

          {/* Class detail grid */}
          <div className="grid grid-cols-3 gap-4 text-sm border-t border-gray-200 pt-4">
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Centre</span>
              <p className="font-bold text-gray-900 mt-0.5">{centerLabel}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Grade</span>
              <p className="font-bold text-gray-900 mt-0.5">{gradeName}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Class</span>
              <p className="font-bold text-gray-900 mt-0.5">{className}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Class Teacher</span>
              <p className="text-gray-900 mt-0.5 border-b border-gray-400 pb-0.5 min-w-[140px]">&nbsp;</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Academic Year</span>
              <p className="font-bold text-gray-900 mt-0.5">2026</p>
            </div>
            <div>
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Total Learners</span>
              <p className="font-bold text-gray-900 mt-0.5">{sorted.length}</p>
            </div>
          </div>
        </div>

        {/* ── Learner table ──────────────────────────────────────────────── */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-center text-xs font-bold w-8">#</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-bold w-24">Student No.</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-bold">Surname &amp; First Name</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center text-xs font-bold w-10">Gen.</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-bold w-20">Date of Birth</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-bold w-24">Home Lang.</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center text-xs font-bold w-28">Signature</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, idx) => (
              <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-500">
                  {idx + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-xs font-mono">
                  {l.studentNumber}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-xs font-medium">
                  {l.lastName.toUpperCase()}, {l.firstName}
                  {l.middleName ? ` ${l.middleName[0]}.` : ''}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-center text-xs">
                  {l.gender === 'MALE' ? 'M' : l.gender === 'FEMALE' ? 'F' : '—'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-xs">
                  {l.dateOfBirth
                    ? format(new Date(l.dateOfBirth), 'dd/MM/yyyy')
                    : '—'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-xs">
                  {l.homeLanguage || '—'}
                </td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
              </tr>
            ))}
            {/* Blank rows to make list feel complete if very short */}
            {sorted.length < 10 && Array.from({ length: 10 - sorted.length }).map((_, i) => (
              <tr key={`blank-${i}`}>
                <td className="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-300">{sorted.length + i + 1}</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
                <td className="border border-gray-300 px-2 py-1.5">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Signature blocks ───────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-3 gap-10 text-xs">
          {[
            'Class Teacher',
            'Head of Department',
            'Principal / Project Leader',
          ].map((role) => (
            <div key={role} className="space-y-6">
              <div>
                <p className="text-gray-500 mb-1">Name: <span className="text-gray-300 italic">(print)</span></p>
                <div className="border-b border-gray-400 h-5" />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Signature:</p>
                <div className="border-b border-gray-400 h-5" />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Date:</p>
                <div className="border-b border-gray-400 h-5" />
              </div>
              <p className="font-semibold text-gray-700 text-center border-t border-gray-300 pt-1">{role}</p>
            </div>
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="mt-8 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
          <span>UL-Junior Project — MWED-BUPHEPHUKGAMA Class Register</span>
          <span>{className} · {gradeName} · 2026</span>
        </div>
      </div>
    )
  }
)
PrintList.displayName = 'PrintList'

// ─── Page ─────────────────────────────────────────────────────────────────
export default function ClassListsPage() {
  const [selectedCenterKey, setSelectedCenterKey] = useState<string>('')
  const [selectedGradeId,   setSelectedGradeId  ] = useState<string>('')
  const [selectedClassId,   setSelectedClassId  ] = useState<string>('')
  const [isPrinting,        setIsPrinting       ] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // All grades with their nested classes
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['grades-all'],
    queryFn:  () => gradesApi.getAll(),
    staleTime: 5 * 60_000,
  })

  // Learners for selected class
  const { data: learnerResp, isLoading: learnersLoading, isFetching } = useQuery({
    queryKey: ['learners-classlist', selectedClassId],
    queryFn:  () => learnersApi.getAll({ classId: selectedClassId, limit: 100 }),
    staleTime: 60_000,
    enabled:  !!selectedClassId,
  })
  const learners: Learner[] = learnerResp?.data ?? []

  // Derive center → grade → class hierarchy from real data
  const centerGroups = React.useMemo(() => {
    const groups: Record<string, { grade: Grade; classes: Grade['classes'] }[]> = {}
    CENTERS.forEach(c => { groups[c.key] = [] })

    grades.forEach(grade => {
      const classesByCentre: Record<string, NonNullable<Grade['classes']>> = {}
      CENTERS.forEach(c => { classesByCentre[c.key] = [] })

      ;(grade.classes ?? []).forEach(cls => {
        const center = getCenterForClass(cls.name)
        if (center) classesByCentre[center.key].push(cls)
      })

      CENTERS.forEach(c => {
        if (classesByCentre[c.key].length > 0) {
          groups[c.key].push({ grade, classes: classesByCentre[c.key] })
        }
      })
    })

    return groups
  }, [grades])

  // Selected objects
  const selectedCenter = CENTERS.find(c => c.key === selectedCenterKey)
  const gradesForCenter = selectedCenterKey ? (centerGroups[selectedCenterKey] ?? []) : []
  const selectedGradeEntry = gradesForCenter.find(g => g.grade.id === selectedGradeId)
  const classesForGrade = selectedGradeEntry?.classes ?? []
  const selectedClass = classesForGrade.find(c => c.id === selectedClassId)

  // Reset cascading selectors on parent change
  useEffect(() => { setSelectedGradeId(''); setSelectedClassId('') }, [selectedCenterKey])
  useEffect(() => { setSelectedClassId('') }, [selectedGradeId])

  // Print handler
  const handlePrint = useCallback(() => {
    document.body.classList.add('classlist-print-mode')
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      document.body.classList.remove('classlist-print-mode')
      setIsPrinting(false)
    }, 150)
  }, [])

  const printDate = format(new Date(), 'd MMMM yyyy, HH:mm')

  const isReady = !!selectedClassId && learners.length >= 0 && !learnersLoading && !isFetching

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-indigo-700 p-6 shadow-lg no-print">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <span className="absolute right-4 bottom-1 text-[8rem] font-black text-white/10 leading-none select-none" aria-hidden="true">
          ≡
        </span>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Printer className="h-4 w-4 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium">UL-Junior Project</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Class Lists</h1>
          <p className="text-primary-100 text-sm mt-1 max-w-lg">
            Select a centre, grade and class to preview the class list, then print directly from your browser.
          </p>
        </div>
      </div>

      {/* ── Selectors ──────────────────────────────────────────────────── */}
      <div className="no-print bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <School className="h-4 w-4 text-primary-500" />
          Select Class
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Centre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Centre
            </label>
            {gradesLoading ? (
              <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={selectedCenterKey}
                  onChange={e => setSelectedCenterKey(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white pr-8
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">— Choose Centre —</option>
                  {CENTERS.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            {selectedCenter && (
              <p className="text-xs text-gray-400 mt-1 pl-1">{selectedCenter.subtitle}</p>
            )}
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Grade
            </label>
            <div className="relative">
              <select
                value={selectedGradeId}
                onChange={e => setSelectedGradeId(e.target.value)}
                disabled={!selectedCenterKey || gradesForCenter.length === 0}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white pr-8
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">— Choose Grade —</option>
                {gradesForCenter.map(({ grade }) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Class
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                disabled={!selectedGradeId || classesForGrade.length === 0}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white pr-8
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">— Choose Class —</option>
                {classesForGrade.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats bar when class is selected */}
        {selectedClassId && (
          <div className="mt-4 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-primary-400" />
              {learnersLoading || isFetching ? (
                <span className="text-gray-400">Loading learners…</span>
              ) : (
                <span><strong className="text-gray-900">{learners.length}</strong> learners enrolled</span>
              )}
            </div>
            {selectedCenter && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <School className="h-4 w-4 text-gray-300" />
                <span>{selectedCenter.subtitle}</span>
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={handlePrint}
                disabled={!isReady || isPrinting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
                           bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                           disabled:opacity-50 disabled:cursor-not-allowed
                           rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isPrinting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparing…</>
                ) : (
                  <><Printer className="h-4 w-4" /> Print Class List</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Empty / loading states ──────────────────────────────────────── */}
      {!selectedClassId && !gradesLoading && (
        <div className="no-print bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
          <GraduationCap className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">No class selected</p>
          <p className="text-xs text-gray-400 mt-1">Choose a centre, grade and class above to preview the list.</p>
        </div>
      )}

      {selectedClassId && (learnersLoading || isFetching) && (
        <div className="no-print bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
          <Loader2 className="h-10 w-10 text-primary-300 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-400">Loading learners…</p>
        </div>
      )}

      {selectedClassId && !learnersLoading && !isFetching && learners.length === 0 && (
        <div className="no-print bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">No learners in this class</p>
          <p className="text-xs text-gray-400 mt-1">This class has no enrolled learners yet.</p>
        </div>
      )}

      {/* ── Print preview ───────────────────────────────────────────────── */}
      {selectedClassId && !learnersLoading && !isFetching && learners.length > 0 && (
        <>
          {/* Screen preview frame */}
          <div className="no-print rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Preview header bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4 text-primary-400" />
                <span className="font-medium">
                  {selectedClass?.name} · {selectedGradeEntry?.grade.name} · {selectedCenter?.label}
                </span>
                <span className="text-gray-400">— Preview</span>
              </div>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white
                           bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors
                           disabled:opacity-50"
              >
                {isPrinting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Print
              </button>
            </div>

            {/* Scaled preview */}
            <div className="bg-gray-100 p-4 overflow-x-auto">
              <div className="mx-auto bg-white shadow-md" style={{ maxWidth: '794px' }}>
                <PrintList
                  ref={printRef}
                  schoolName="MWED-BUPHEPHUKGAMA"
                  centerLabel={selectedCenter?.label ?? ''}
                  gradeName={selectedGradeEntry?.grade.name ?? ''}
                  className={selectedClass?.name ?? ''}
                  learners={learners}
                  printDate={printDate}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
