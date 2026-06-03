'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Printer, ArrowLeft, Eye, EyeOff, ChevronRight,
} from 'lucide-react'
import {
  getDA, SUBJECT_CONFIG, SECTION_INFO, TOTAL_MARKS,
  MATCHING_SCRAMBLE, matchingAnswer,
  type SubjectSlug,
} from '@/lib/da-questions'
import { SchoolSeal } from '@/components/ui/SchoolSeal'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const OPTION_LABELS = ['A', 'B', 'C', 'D']

// Build the scrambled Column B for the matching section
function buildColumnB(pairs: { left: string; right: string }[]) {
  return MATCHING_SCRAMBLE.map(idx => pairs[idx].right)
}

// ─── Print section wrapper ────────────────────────────────────────────────────
function SectionHeader({ letter, title, marks }: { letter: string; title: string; marks: number }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <div className="h-9 w-9 rounded-xl bg-gray-900 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
        {letter}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">[{marks} mark{marks !== 1 ? 's' : ''}]</span>
      <div className="h-px flex-1 bg-gray-300" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DiagnosticPaperPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const subject = params.subject as SubjectSlug
  const grade   = Number(params.grade)

  const da  = getDA(subject, grade)
  const cfg = da ? SUBJECT_CONFIG[da.subject] : null

  const [showMemo,    setShowMemo   ] = useState(false)
  const [isPrinting,  setIsPrinting ] = useState(false)
  const printDate = format(new Date(), 'd MMMM yyyy')

  // Auto-print if ?print=1 query param was set (from overview page Print button)
  useEffect(() => {
    if (searchParams.get('print') === '1') {
      setTimeout(() => handlePrint(), 400)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePrint = useCallback(() => {
    setShowMemo(false)
    document.body.classList.add('classlist-print-mode')
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      document.body.classList.remove('classlist-print-mode')
      setIsPrinting(false)
    }, 150)
  }, [])

  if (!da || !cfg) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Assessment not found</p>
          <p className="text-sm text-gray-400 mt-1">No DA is defined for this subject / grade combination.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-primary-600 hover:underline flex items-center gap-1 mx-auto">
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
        </div>
      </div>
    )
  }

  const columnB = buildColumnB(da.sections.sectionB)

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Screen toolbar (hidden on print) ─────────────────────────────── */}
      <div className="no-print flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All DAs
        </button>

        <div className="flex-1" />

        {/* Subject + grade badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeCls}`}>
          <span>{cfg.symbol}</span>
          {cfg.label} · Grade {grade}
        </span>

        <button
          onClick={() => setShowMemo(v => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600
            border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {showMemo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showMemo ? 'Hide Memo' : 'Show Memo'}
        </button>

        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white
            bg-gradient-to-r ${cfg.gradient} rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity`}
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? 'Preparing…' : 'Print Paper'}
        </button>
      </div>

      {/* ── Paper ─────────────────────────────────────────────────────────── */}
      <div className="classlist-print-area bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 max-w-3xl mx-auto">

          {/* ── Document header ─────────────────────────────────────────── */}
          <div className="flex items-start gap-6 pb-5 border-b-2 border-gray-800 mb-6">
            <SchoolSeal size={120} topLabel="UL-Junior Project" bottomLabel="MWED-BUPHEPHUKGAMA" variant="dark" />

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-amber-700 uppercase tracking-widest leading-tight">
                UL-Junior Project
              </h1>
              <p className="text-base font-bold text-gray-900 uppercase tracking-wide">
                MWED-BUPHEPHUKGAMA
              </p>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assessment</span>
                  <p className="font-bold text-gray-900">Diagnostic Assessment</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Subject</span>
                  <p className="font-bold text-gray-900">{da.subjectLabel}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Grade</span>
                  <p className="font-bold text-gray-900">Grade {da.grade}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Marks</span>
                  <p className="font-bold text-gray-900">{TOTAL_MARKS}</p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-gray-500 flex-shrink-0">
              <p>{printDate}</p>
              <p className="mt-1">Academic Year 2026</p>
            </div>
          </div>

          {/* Learner details strip */}
          <div className="grid grid-cols-3 gap-6 mb-6 text-sm">
            {['Learner Name', 'Class', 'Student Number'].map(label => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}:</p>
                <div className="border-b border-gray-400 h-6" />
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-700">
            <p className="font-bold mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-600">
              <li><strong>Section A (MCQ):</strong> Circle the letter of the correct answer.</li>
              <li><strong>Section B (Matching):</strong> Write the letter from Column B next to the number in Column A.</li>
              <li><strong>Section C (True/False):</strong> Circle T for True or F for False.</li>
              <li><strong>Section D (Reasoned MCQ):</strong> Circle the correct answer AND give a written reason in the space provided. (2 marks each: 1 for correct answer, 1 for valid reasoning.)</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              This assessment evaluates the requisite knowledge for Grade {da.grade} — it is not limited to the Grade {da.grade} syllabus.
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION A — MCQ */}
          {/* ════════════════════════════════════════════════════════════ */}
          <SectionHeader letter="A" title={`Multiple Choice — ${SECTION_INFO.A.type}`} marks={SECTION_INFO.A.marks} />
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Circle the letter of the ONE best answer. (1 mark each)
          </p>

          <div className="space-y-5">
            {da.sections.sectionA.map((q, i) => (
              <div key={q.id} className="text-sm">
                <p className="font-medium text-gray-900 mb-2">
                  <span className="font-bold">{i + 1}.</span>&nbsp;{q.question}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-5">
                  {q.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-start gap-2">
                      <span className={`font-bold flex-shrink-0 ${showMemo && opt.id === q.answer ? 'text-emerald-600 underline' : 'text-gray-600'}`}>
                        {OPTION_LABELS[oi]}.
                      </span>
                      <span className={showMemo && opt.id === q.answer ? 'text-emerald-700 font-semibold' : 'text-gray-700'}>
                        {opt.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section A mark box */}
          <div className="flex justify-end mt-4">
            <div className="border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-500">
              Section A: _____ / {SECTION_INFO.A.marks}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION B — Matching */}
          {/* ════════════════════════════════════════════════════════════ */}
          <SectionHeader letter="B" title="Matching" marks={SECTION_INFO.B.marks} />
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Write the letter from Column B next to the matching number in Column A. (1 mark each)
          </p>

          <div className="grid grid-cols-2 gap-8">
            {/* Column A */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Column A</p>
              <div className="space-y-3">
                {da.sections.sectionB.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-700 w-5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-gray-800">{pair.left}</span>
                    <div className="flex-1 border-b border-dotted border-gray-400 mx-1" />
                    {/* Answer slot + memo */}
                    <span className={`w-6 text-center font-bold ${showMemo ? 'text-emerald-600' : 'text-transparent border-b border-gray-400'}`}>
                      {showMemo ? matchingAnswer(i) : '_'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B (scrambled) */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Column B</p>
              <div className="space-y-3">
                {columnB.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-gray-700 w-5 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <div className="border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-500">
              Section B: _____ / {SECTION_INFO.B.marks}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION C — True / False */}
          {/* ════════════════════════════════════════════════════════════ */}
          <SectionHeader letter="C" title="True / False" marks={SECTION_INFO.C.marks} />
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Circle <strong>T</strong> if the statement is true or <strong>F</strong> if it is false. (1 mark each)
          </p>

          <div className="space-y-4">
            {da.sections.sectionC.map((q, i) => {
              const correct = q.answer
              return (
                <div key={q.id} className="flex items-start gap-3 text-sm">
                  <span className="font-bold text-gray-700 w-5 flex-shrink-0 pt-0.5">{i + 1}.</span>
                  <span className="flex-1 text-gray-800">{q.statement}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-default
                      ${showMemo && correct ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600'}`}>
                      T
                    </span>
                    <span className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-default
                      ${showMemo && !correct ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600'}`}>
                      F
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end mt-4">
            <div className="border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-500">
              Section C: _____ / {SECTION_INFO.C.marks}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION D — Reasoned MCQ */}
          {/* ════════════════════════════════════════════════════════════ */}
          <SectionHeader letter="D" title="Reasoned Multiple Choice" marks={SECTION_INFO.D.marks} />
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Circle the correct answer AND write a reason for your choice in the space provided.
            (2 marks each: 1 for the correct answer, 1 for a valid written reason.)
          </p>

          <div className="space-y-8">
            {da.sections.sectionD.map((q, i) => (
              <div key={q.id} className="text-sm">
                <p className="font-medium text-gray-900 mb-2">
                  <span className="font-bold">{i + 1}.</span>&nbsp;{q.question}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-5 mb-3">
                  {q.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-start gap-2">
                      <span className={`font-bold flex-shrink-0 ${showMemo && opt.id === q.answer ? 'text-emerald-600 underline' : 'text-gray-600'}`}>
                        {OPTION_LABELS[oi]}.
                      </span>
                      <span className={showMemo && opt.id === q.answer ? 'text-emerald-700 font-semibold' : 'text-gray-700'}>
                        {opt.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reasoning space */}
                <div className="pl-5">
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-semibold">Reason:</span>
                  </p>
                  {showMemo ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                      {q.markingNote}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="border-b border-gray-300 h-5" />
                      <div className="border-b border-gray-300 h-5" />
                      <div className="border-b border-gray-300 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <div className="border border-gray-300 rounded-lg px-4 py-1.5 text-xs text-gray-500">
              Section D: _____ / {SECTION_INFO.D.marks}
            </div>
          </div>

          {/* ── Grand total ─────────────────────────────────────────────── */}
          <div className="mt-8 pt-5 border-t-2 border-gray-800 flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-600">
              {da.subjectLabel} · Grade {da.grade} Diagnostic Assessment · 2026
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">TOTAL:</span>
              <div className="border-2 border-gray-800 rounded-lg px-5 py-1.5 text-base font-black text-gray-900">
                _____ / {TOTAL_MARKS}
              </div>
            </div>
          </div>

          {/* Marking memo header (screen only, not printed) */}
          {showMemo && (
            <div className="no-print mt-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
              <p className="font-bold mb-1">Marking Memorandum</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                <p>Section A: {da.sections.sectionA.map(q => q.answer.toUpperCase()).join(', ')}</p>
                <p>Section C: {da.sections.sectionC.map(q => q.answer ? 'T' : 'F').join(', ')}</p>
                <p>Section B: {da.sections.sectionB.map((_, i) => `${i+1}→${matchingAnswer(i)}`).join(', ')}</p>
                <p>Section D: {da.sections.sectionD.map(q => q.answer.toUpperCase()).join(', ')}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
