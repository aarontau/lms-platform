'use client'

import React from 'react'
import Link from 'next/link'
import { Stethoscope, FileText, Printer, ChevronRight, Info } from 'lucide-react'
import {
  DA_DEFINITIONS, SUBJECT_CONFIG, SECTION_INFO, TOTAL_MARKS,
  type SubjectSlug,
} from '@/lib/da-questions'

const SUBJECTS: SubjectSlug[] = ['mathematics', 'natural-science', 'english']
const GRADES  = [8, 9] as const

const SECTION_PILLS = [
  { key: 'A', label: 'MCQ',          color: 'bg-blue-100 text-blue-700'    },
  { key: 'B', label: 'Matching',     color: 'bg-amber-100 text-amber-700'  },
  { key: 'C', label: 'True / False', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'D', label: 'Reasoned MCQ', color: 'bg-violet-100 text-violet-700' },
]

export default function DiagnosticOverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <span className="absolute right-5 bottom-1 text-[7rem] font-black text-white/10 leading-none select-none" aria-hidden="true">
          DA
        </span>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium">UL-Junior Project</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Diagnostic Assessment</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Baseline assessments for Grades 8 and 9 across Mathematics, Natural Science and English.
            Each DA evaluates the requisite knowledge learners need for their current grade.
          </p>
        </div>
      </div>

      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong>Purpose:</strong> The DA is not necessarily based on the current grade's content.
          It assesses the <em>requisite knowledge and understanding</em> a learner must have to access the current grade's curriculum.
          Results provide a baseline for targeted support planning.
        </div>
      </div>

      {/* ── Section key ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assessment Structure (25 marks per DA)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(SECTION_INFO).map(([key, info]) => (
            <div key={key} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <span className="h-7 w-7 rounded-lg bg-slate-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                {key}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{info.type}</p>
                <p className="text-xs text-gray-400">{info.count} × {info.perQ} = {info.marks} marks</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DA cards — grouped by subject ────────────────────────────────── */}
      <div className="space-y-6">
        {SUBJECTS.map(subject => {
          const cfg = SUBJECT_CONFIG[subject]
          return (
            <div key={subject}>
              {/* Subject heading */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${cfg.gradient} text-white text-sm font-black flex items-center justify-center flex-shrink-0`}>
                  {cfg.symbol}
                </div>
                <h2 className="text-base font-bold text-gray-900">{cfg.label}</h2>
                <div className="flex-1 h-px bg-gray-200 ml-2" />
              </div>

              {/* Grade 8 & 9 cards side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GRADES.map(grade => {
                  const da = DA_DEFINITIONS.find(d => d.subject === subject && d.grade === grade)
                  if (!da) return null
                  return (
                    <div
                      key={grade}
                      className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden flex flex-col`}
                    >
                      {/* Card header strip */}
                      <div className={`bg-gradient-to-r ${cfg.gradient} px-5 py-3 flex items-center justify-between`}>
                        <div>
                          <p className="text-white font-bold text-base leading-tight">{cfg.label}</p>
                          <p className="text-white/75 text-xs mt-0.5">
                            Assesses Grade {da.requisiteGrade} requisite knowledge
                          </p>
                        </div>
                        <span className="h-9 w-9 rounded-xl bg-white/20 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                          G{grade}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="px-5 py-4 flex-1 space-y-3">
                        {/* Section pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {SECTION_PILLS.map(p => (
                            <span key={p.key} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${p.color}`}>
                              <span className="font-bold">{p.key}:</span> {p.label}
                            </span>
                          ))}
                        </div>

                        {/* Mark breakdown */}
                        <div className="grid grid-cols-4 gap-1 text-center">
                          {Object.entries(SECTION_INFO).map(([k, v]) => (
                            <div key={k} className="bg-gray-50 rounded-lg py-1.5">
                              <p className="text-xs text-gray-400 font-medium">Sec {k}</p>
                              <p className="text-sm font-bold text-gray-800">{v.marks}<span className="text-xs font-normal text-gray-400"> m</span></p>
                            </div>
                          ))}
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${cfg.textColor}`}>Total: {TOTAL_MARKS} marks</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-5 pb-4 flex gap-2">
                        <Link
                          href={`/assessment/diagnostic/${subject}/${grade}`}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl
                            bg-gradient-to-r ${cfg.gradient} text-white hover:opacity-90 transition-opacity`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Paper
                        </Link>
                        <Link
                          href={`/assessment/diagnostic/${subject}/${grade}?print=1`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl
                            border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
